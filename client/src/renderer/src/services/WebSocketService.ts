import { API_CONFIG } from '$src/shared/config'
import type { WebSocketMessage, WebSocketMessageOut } from '$src/interfaces/WebSocketMessages'
import { errorService } from '$src/services/ErrorService'
import { WebSocketMessageType } from '$src/interfaces/WebSocketMessageType'

type MessageHandler = (data: WebSocketMessage<unknown>) => void

class WebSocketService {
  private ws: WebSocket | null = null
  private handlers: Map<string, MessageHandler[]> = new Map()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private intentionalDisconnect = false

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return

    const token = sessionStorage.getItem('authToken')
    if (!token) {
      errorService.reportError('No auth token found')
      return
    }

    this.intentionalDisconnect = false

    try {
      this.ws = new WebSocket(API_CONFIG.wsUrl + `?token=${token}`)
    } catch (error) {
      errorService.reportError('Cannot connect to WebSocket server: ' + error)
      return
    }

    this.ws.onopen = () => {
      console.log('WebSocket connected')
      this.reconnectAttempts = 0
    }

    this.ws.onmessage = (event): void => {
      const data = JSON.parse(event.data)
      if (data.type === WebSocketMessageType.CALL_CANDIDATE)
        console.log('[WS] CALL_CANDIDATE received (raw)', data)
      const handlers = this.handlers.get(data.type) || []
      handlers.forEach((handler) => handler(data))
    }

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    this.ws.onclose = () => {
      console.log('WebSocket disconnected')
      if (this.intentionalDisconnect) return

      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++
        console.log(`Reconnecting... (attempt ${this.reconnectAttempts})`)
        setTimeout(() => this.connect(), 5000)
      } else {
        errorService.reportError('Could not connect to server')
      }
    }
  }

  disconnect(): void {
    this.intentionalDisconnect = true
    this.reconnectAttempts = 0
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  send<T>(message: WebSocketMessageOut<T>): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.error('WebSocket is not connected')
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
}

export const webSocketService = new WebSocketService()
