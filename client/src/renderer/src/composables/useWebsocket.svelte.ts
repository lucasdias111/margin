import type { WebSocketMessageType } from '$src/interfaces/WebSocketMessageType'
import type { WebSocketMessage } from '$src/interfaces/WebSocketMessages'
import { webSocketService } from '$src/services/WebSocketService'

type MessageHandler = (data: WebSocketMessage<unknown>) => void

export function useWebsocketSvelte(
  subscriptions: Partial<Record<WebSocketMessageType, MessageHandler>>
): void {
  $effect(() => {
    const entries = Object.entries(subscriptions) as [WebSocketMessageType, MessageHandler][]

    entries.forEach(([type, handler]) => {
      webSocketService.on(type, handler)
    })

    return () => {
      entries.forEach(([type, handler]) => {
        webSocketService.off(type, handler)
      })
    }
  })
}
