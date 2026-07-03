import type { User } from '$src/interfaces/User'

export interface Notification {
  notificationId: number
  recipient: User
  sender: User | null
  type: NotificationType
  referenceId: number
  marginId: number
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
  SUBSCRIPTION_UPGRADED = 'SUBSCRIPTION_UPGRADED',
  SUBSCRIPTION_PAYMENT_FAILED = 'SUBSCRIPTION_PAYMENT_FAILED',
  SUBSCRIPTION_LIMIT_WARNING = 'SUBSCRIPTION_LIMIT_WARNING'
}
