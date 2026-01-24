import { API_CONFIG } from '$src/shared/config'
import type { WebSocketMessageOut } from '$src/interfaces/WebSocketMessages'

type MessageHandler = (data: any) => void

class WebSocketService {
  private ws: WebSocket | null = null
  private handlers: Map<string, MessageHandler[]> = new Map()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected')
      return
    }

    const token = sessionStorage.getItem('authToken')
    if (!token) {
      console.error('No auth token found')
      return
    }

    this.ws = new WebSocket(API_CONFIG.wsUrl + `ws?token=${token}`)

    this.ws.onopen = () => {
      console.log('WebSocket connected')
      this.reconnectAttempts = 0
    }

    this.ws.onmessage = (event): void => {
      try {
        const data = JSON.parse(event.data)
        console.log('Received message:', data)
        const handlers = this.handlers.get(data.type) || []

        handlers.forEach((handler) => {
          handler(data)
        })
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error)
      }
    }
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    this.ws.onclose = () => {
      console.log('WebSocket disconnected')

      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++
        console.log(`Reconnecting... (attempt ${this.reconnectAttempts})`)
        setTimeout(() => this.connect(), 3000)
      }
    }
  }

  disconnect(): void {
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
    console.log(`Registering handler for: ${messageType}`)
    if (!this.handlers.has(messageType)) {
      this.handlers.set(messageType, [])
    }
    this.handlers.get(messageType)!.push(handler)
    console.log(`Total handlers for ${messageType}:`, this.handlers.get(messageType)!.length)
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
