import { NotificationType, type Notification } from '$src/interfaces/Notification'

const ICONS: Record<NotificationType, string> = {
  [NotificationType.ANNOUNCEMENT]: '📢',
  [NotificationType.MISSED_CALL]: '📞',
  [NotificationType.ADDED_TO_MARGIN]: '👥',
  [NotificationType.INVITED_TO_MARGIN]: '✉️',
  [NotificationType.CONVERSATION_INVITE]: '💬',
  [NotificationType.MESSAGE_REACTION]: '👍',
  [NotificationType.THREAD_REPLY]: '🧵',
  [NotificationType.MEETING_INVITE]: '📅',
  [NotificationType.MEETING_REMINDER]: '📅',
  [NotificationType.MEETING_STARTED]: '📅'
}

export function notificationIcon(type: NotificationType): string {
  return ICONS[type] ?? '🔔'
}

export function notificationTitle(notification: Notification): string {
  const who = notification.sender?.displayName ?? 'Someone'

  switch (notification.type) {
    case NotificationType.ANNOUNCEMENT:
      return `New announcement from ${notification.sender?.displayName ?? 'Admin'}`
    case NotificationType.MISSED_CALL:
      return `Missed call from ${notification.sender?.displayName ?? 'Unknown'}`
    case NotificationType.ADDED_TO_MARGIN:
      return `${who} added you to a margin`
    case NotificationType.INVITED_TO_MARGIN:
      return `${who} invited you to join a margin`
    case NotificationType.CONVERSATION_INVITE:
      return `${who} invited you to a conversation`
    case NotificationType.MESSAGE_REACTION:
      return `${who} reacted to your message`
    case NotificationType.THREAD_REPLY:
      return `${who} replied in a thread you follow`
    case NotificationType.MEETING_INVITE:
      return `${who} invited you to a meeting`
    case NotificationType.MEETING_REMINDER:
      return 'A meeting you are invited to starts in 10 minutes'
    case NotificationType.MEETING_STARTED:
      return 'A meeting you are invited to is starting now'
    default:
      return 'New notification'
  }
}
