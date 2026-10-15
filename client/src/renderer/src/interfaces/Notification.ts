import type { User } from '$src/interfaces/User'

export interface Notification {
  notificationId: number
  sender: User | null
  type: NotificationType
  referenceId: number
  marginId: number | null
  conversationId: number | null
  seen: boolean
  createdAt: string
}

export enum NotificationType {
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  MISSED_CALL = 'MISSED_CALL',
  ADDED_TO_MARGIN = 'ADDED_TO_MARGIN',
  INVITED_TO_MARGIN = 'INVITED_TO_MARGIN',
  CONVERSATION_INVITE = 'CONVERSATION_INVITE',
  MESSAGE_REACTION = 'MESSAGE_REACTION',
  THREAD_REPLY = 'THREAD_REPLY',
  SUBSCRIPTION_UPGRADED = 'SUBSCRIPTION_UPGRADED',
  SUBSCRIPTION_PAYMENT_FAILED = 'SUBSCRIPTION_PAYMENT_FAILED',
  SUBSCRIPTION_LIMIT_WARNING = 'SUBSCRIPTION_LIMIT_WARNING',
  MEETING_INVITE = 'MEETING_INVITE',
  MEETING_REMINDER = 'MEETING_REMINDER',
  MEETING_STARTED = 'MEETING_STARTED'
}
