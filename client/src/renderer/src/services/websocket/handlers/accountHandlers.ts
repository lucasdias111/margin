import { WebSocketMessageType } from '$src/interfaces/WebSocketMessageType'
import type { Notification } from '$src/interfaces/Notification'
import type { WebSocketMessage } from '$src/interfaces/WebSocketMessages'
import type { MessageHandler } from '$src/services/websocket/WebSocketService'
import { notificationState } from '$src/states/NotificationState.svelte'

export const accountHandlers = {
  [WebSocketMessageType.NOTIFICATION]: (data: WebSocketMessage<Notification>) => {
    notificationState.addNotification(data.payload)
  }
} satisfies Partial<Record<WebSocketMessageType, MessageHandler>>
