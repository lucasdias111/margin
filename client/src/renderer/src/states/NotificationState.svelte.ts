import type { UnreadCount } from '$src/interfaces/UnreadCount'
import type { Space } from '$src/interfaces/Space'
import type { Notification } from '$src/interfaces/Notification'

interface NotificationState {
  unreadDirectMessages: UnreadCount[]
  unreadChannelMessages: UnreadCount[]
  notifications: Notification[]
  notificationsLoaded: boolean
}

class NotificationStateManager {
  private state = $state<NotificationState>({
    unreadDirectMessages: [],
    unreadChannelMessages: [],
    notifications: [],
    notificationsLoaded: false
  })

  get notifications(): Notification[] {
    return this.state.notifications
  }

  get notificationsLoaded(): boolean {
    return this.state.notificationsLoaded
  }

  get unreadChannelMessages(): UnreadCount[] {
    return this.state.unreadChannelMessages
  }

  setNotifications(notifications: Notification[]): void {
    this.state.notifications = notifications
    this.state.notificationsLoaded = true
  }

  markNotificationSeen(notificationId: number): void {
    const notification = this.state.notifications.find((n) => n.notificationId === notificationId)
    if (notification) {
      notification.seen = true
    }
  }

  removeNotificationByReferenceId(referenceId: number): void {
    this.state.notifications = this.state.notifications.filter((n) => n.referenceId !== referenceId)
  }

  addNotification(notification: Notification): void {
    this.state.notifications = [notification, ...this.state.notifications]
  }

  getTotalUnseenNotifications(): number {
    return this.state.notifications.filter((n) => !n.seen).length
  }

  getUnseenCountForMargin(marginId: number): number {
    return this.state.notifications.filter((n) => n.marginId === marginId && !n.seen).length
  }

  // --- Unread message counts (unchanged) ---

  addUnreadDirectMessages(directMessages: UnreadCount[]): void {
    this.state.unreadDirectMessages = this.state.unreadDirectMessages.concat(directMessages)
  }

  addUnreadChannelMessages(channelMessages: UnreadCount[]): void {
    this.state.unreadChannelMessages = this.state.unreadChannelMessages.concat(channelMessages)
  }

  getTotalUnreadDirectMessagesForUser(userId: number): number {
    return this.state.unreadDirectMessages.filter((msg) => msg.fromUserId === userId).length
  }

  getTotalUnreadMessagesForChannel(conversationId: number): UnreadCount[] {
    return this.state.unreadChannelMessages.filter((msg) => msg.conversationId === conversationId)
  }

  clearUnreadMessagesForConversation(conversationId: number): void {
    this.state.unreadDirectMessages = this.state.unreadDirectMessages.filter(
      (msg) => msg.conversationId !== conversationId
    )
    this.state.unreadChannelMessages = this.state.unreadChannelMessages.filter(
      (msg) => msg.conversationId !== conversationId
    )
  }

  clearUnreadMessages(): void {
    this.state.unreadChannelMessages = this.state.unreadChannelMessages.slice()
    this.state.unreadDirectMessages = this.state.unreadDirectMessages.slice()
  }

  getTotalUnreadDirectMessages(): number {
    return this.state.unreadDirectMessages.length
  }

  getTotalUnreadChannelMessages(): number {
    return this.state.unreadChannelMessages.length
  }

  getTotalUnreadMessagesForSpace(space: Space): UnreadCount[] {
    return space.channels.flatMap((channel) =>
      this.getTotalUnreadMessagesForChannel(channel.conversationId)
    )
  }

  getTotalUnreadChannelsForMargin(marginId: number): number {
    return this.state.unreadChannelMessages.filter((msg) => msg.marginId === marginId).length
  }

  getTotalUnreadForMargin(marginId: number): number {
    const channelUnread = this.getTotalUnreadChannelsForMargin(marginId)
    const unseenNotifications = this.getUnseenCountForMargin(marginId)
    return channelUnread + unseenNotifications
  }
}

export const notificationState = new NotificationStateManager()
