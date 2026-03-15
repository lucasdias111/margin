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
  ADDED_TO_MARGIN = 'ADDED_TO_MARGIN'
}
