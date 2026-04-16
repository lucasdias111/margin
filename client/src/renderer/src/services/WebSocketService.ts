import { API_CONFIG } from '$src/shared/config'
import type { WebSocketMessage, WebSocketMessageOut } from '$src/interfaces/WebSocketMessages'
import { errorService } from '$src/services/ErrorService'
import { WebSocketMessageType } from '$src/interfaces/WebSocketMessageType'
import { connectionState } from '$src/states/ConnectionState.svelte'
import { authenticationService } from '$src/services/AuthenticationService'
import { push } from 'svelte-spa-router'

type MessageHandler = (data: WebSocketMessage<unknown>) => void

const PING_INTERVAL_MS = 30_000
const PONG_TIMEOUT_MS = 10_000
const BASE_RECONNECT_DELAY_MS = 1_000
const MAX_RECONNECT_DELAY_MS = 30_000
const MAX_RECONNECT_ATTEMPTS = 20

class WebSocketService {
  private ws: WebSocket | null = null
  private handlers: Map<string, MessageHandler[]> = new Map()
  private reconnectAttempts = 0
  private intentionalDisconnect = false
  private isRestoringSession = false

  private pingInterval: ReturnType<typeof setInterval> | null = null
  private pongTimeout: ReturnType<typeof setTimeout> | null = null
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null

  private onReconnectCallback: (() => void) | null = null

  connect(): void {
    if (this.isRestoringSession) return
    if (this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING)
      return

    const token = this.resolveToken()
    if (token === 'restoring') return
    if (!token) {
      this.terminateSession()
      return
    }

    this.openConnection(token)
    document.addEventListener('visibilitychange', this.handleVisibilityChange)
  }

  disconnect(): void {
    this.intentionalDisconnect = true
    this.reconnectAttempts = 0
    this.stopPing()
    this.clearReconnectTimeout()
    document.removeEventListener('visibilitychange', this.handleVisibilityChange)

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    connectionState.connectionStatus = 'disconnected'
  }

  send<T>(message: WebSocketMessageOut<T>): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket is not connected — message dropped', message.type)
    }
  }

  on(messageType: string, handler: MessageHandler): void {
    if (!this.handlers.has(messageType)) {
      this.handlers.set(messageType, [])
    }
    const existing = this.handlers.get(messageType)!
    if (!existing.includes(handler)) {
      existing.push(handler)
    }
  }

  off(messageType: string, handler: MessageHandler): void {
    const handlers = this.handlers.get(messageType)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  onReconnect(callback: () => void): void {
    this.onReconnectCallback = callback
  }

  private resolveToken(): string | null | 'restoring' {
    const token = sessionStorage.getItem('authToken')

    if (!token) {
      this.attemptSessionRestore()
      return 'restoring'
    }

    if (this.isTokenExpired(token)) {
      console.warn('JWT expired — clearing session')
      sessionStorage.removeItem('authToken')
      sessionStorage.removeItem('privateKey')
      return null
    }

    return token
  }

  private attemptSessionRestore(): void {
    this.isRestoringSession = true

    authenticationService.tryRestoreSession().then((restored) => {
      this.isRestoringSession = false
      if (this.intentionalDisconnect) return

      if (restored) {
        this.connect()
      } else {
        this.terminateSession()
      }
    })
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.exp * 1000 < Date.now()
    } catch {
      return true
    }
  }

  private openConnection(token: string): void {
    this.intentionalDisconnect = false
    connectionState.connectionStatus =
      this.reconnectAttempts > 0 ? 'reconnecting' : connectionState.connectionStatus

    try {
      this.ws = new WebSocket(API_CONFIG.wsUrl + `?token=${token}`)
    } catch (error) {
      errorService.reportError('Cannot connect to WebSocket server: ' + error)
      connectionState.connectionStatus = 'disconnected'
      return
    }

    this.ws.onopen = () => {
      console.log('WebSocket connected')
      const wasReconnect = this.reconnectAttempts > 0
      this.reconnectAttempts = 0
      connectionState.connectionStatus = 'connected'
      this.startPing()

      if (wasReconnect && this.onReconnectCallback) {
        this.onReconnectCallback()
      }
    }

    this.ws.onmessage = (event): void => {
      const data = JSON.parse(event.data)

      if (data.type === WebSocketMessageType.PONG) {
        this.clearPongTimeout()
        return
      }

      const handlers = this.handlers.get(data.type) || []
      handlers.forEach((handler) => handler(data))
    }

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    this.ws.onclose = (event) => {
      console.log(`WebSocket disconnected (code: ${event.code}, reason: ${event.reason})`)
      this.stopPing()

      if (this.intentionalDisconnect) {
        connectionState.connectionStatus = 'disconnected'
        return
      }

      if (event.code === 4001) {
        console.warn('WebSocket closed due to auth failure — not reconnecting')
        this.terminateSession('Session expired. Please log in again.')
        return
      }

      this.scheduleReconnect()
    }
  }

  private terminateSession(userMessage?: string): void {
    this.intentionalDisconnect = true
    this.clearReconnectTimeout()
    this.stopPing()
    connectionState.connectionStatus = 'disconnected'

    if (userMessage) {
      errorService.reportError(userMessage)
    }

    authenticationService.logoutUser().then(() => push('/'))
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error(`Max reconnect attempts (${MAX_RECONNECT_ATTEMPTS}) reached`)
      connectionState.connectionStatus = 'disconnected'
      errorService.reportError('Lost connection to server. Please refresh the page.')
      return
    }

    connectionState.connectionStatus = 'reconnecting'
    this.reconnectAttempts++

    const exponentialDelay = Math.min(
      BASE_RECONNECT_DELAY_MS * Math.pow(2, this.reconnectAttempts - 1),
      MAX_RECONNECT_DELAY_MS
    )
    const jitter = exponentialDelay * 0.2 * Math.random()
    const delay = exponentialDelay + jitter

    console.log(`Reconnecting in ${Math.round(delay)}ms (attempt ${this.reconnectAttempts})`)

    this.clearReconnectTimeout()
    this.reconnectTimeout = setTimeout(() => this.connect(), delay)
  }

  private clearReconnectTimeout(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
  }

  private startPing(): void {
    this.stopPing()
    this.pingInterval = setInterval(() => this.sendPing(), PING_INTERVAL_MS)
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
    this.clearPongTimeout()
  }

  private sendPing(): void {
    if (this.ws?.readyState !== WebSocket.OPEN) return

    this.ws.send(JSON.stringify({ type: WebSocketMessageType.PING }))

    this.clearPongTimeout()
    this.pongTimeout = setTimeout(() => {
      console.warn('Pong timeout — closing dead connection')
      this.ws?.close()
    }, PONG_TIMEOUT_MS)
  }

  private clearPongTimeout(): void {
    if (this.pongTimeout) {
      clearTimeout(this.pongTimeout)
      this.pongTimeout = null
    }
  }

  private handleVisibilityChange = (): void => {
    if (document.visibilityState !== 'visible') return
    if (this.intentionalDisconnect) return

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      if (this.reconnectTimeout) console.log('Tab visible — connection dead, reconnecting')
      this.reconnectAttempts = 0
      this.connect()
      return
    }

    this.sendPing()
  }
}

export const webSocketService = new WebSocketService()
