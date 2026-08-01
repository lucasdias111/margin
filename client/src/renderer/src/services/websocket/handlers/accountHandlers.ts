import { WebSocketMessageType } from '$src/interfaces/WebSocketMessageType'
import type { Notification } from '$src/interfaces/Notification'
import type { Subscription } from '$src/interfaces/Subscription'
import type { WebSocketMessage } from '$src/interfaces/WebSocketMessages'
import type { MessageHandler } from '$src/services/websocket/WebSocketService'
import { notificationState } from '$src/states/NotificationState.svelte'
import { subscriptionState } from '$src/states/SubscriptionState.svelte'

export const accountHandlers = {
  [WebSocketMessageType.NOTIFICATION]: (data: WebSocketMessage<Notification>) => {
    notificationState.addNotification(data.payload)
  },

  [WebSocketMessageType.SUBSCRIPTION_UPDATED]: (data: WebSocketMessage<Subscription>) => {
    subscriptionState.set(data.payload)
  }
} satisfies Partial<Record<WebSocketMessageType, MessageHandler>>
