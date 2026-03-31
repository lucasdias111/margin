import type { Space } from '$src/interfaces/Space'
import type { Notification } from '$src/interfaces/Notification'

class NotificationStateManager {
  private state = $state<{
    unreadDirectConversationIds: Set<number>
    unreadChannelConversations: Map<number, number>
    notifications: Notification[]
    notificationsLoaded: boolean
  }>({
    unreadDirectConversationIds: new Set(),
    unreadChannelConversations: new Map(),
    notifications: [],
    notificationsLoaded: false
  })

  get notifications(): Notification[] {
    return this.state.notifications
  }

  get notificationsLoaded(): boolean {
    return this.state.notificationsLoaded
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

  // --- Unread conversations ---

  addUnreadDirectConversations(conversationIds: number[]): void {
    conversationIds.forEach((id) => this.state.unreadDirectConversationIds.add(id))
    this.state.unreadDirectConversationIds = new Set(this.state.unreadDirectConversationIds)
  }

  addUnreadChannelConversations(channels: { conversationId: number; marginId: number }[]): void {
    channels.forEach((ch) =>
      this.state.unreadChannelConversations.set(ch.conversationId, ch.marginId)
    )
    this.state.unreadChannelConversations = new Map(this.state.unreadChannelConversations)
  }

  isConversationUnread(conversationId: number): boolean {
    return (
      this.state.unreadDirectConversationIds.has(conversationId) ||
      this.state.unreadChannelConversations.has(conversationId)
    )
  }

  getTotalUnreadDirectMessages(): number {
    return this.state.unreadDirectConversationIds.size
  }

  getTotalUnreadChannelMessages(): number {
    return this.state.unreadChannelConversations.size
  }

  isChannelUnread(conversationId: number): boolean {
    return this.state.unreadChannelConversations.has(conversationId)
  }

  isDirectConversationUnread(conversationId: number): boolean {
    return this.state.unreadDirectConversationIds.has(conversationId)
  }

  getTotalUnreadMessagesForSpace(space: Space): number {
    return space.channels.filter((ch) =>
      this.state.unreadChannelConversations.has(ch.conversationId)
    ).length
  }

  getTotalUnreadChannelsForMargin(marginId: number): number {
    let count = 0
    for (const mid of this.state.unreadChannelConversations.values()) {
      if (mid === marginId) count++
    }
    return count
  }

  getTotalUnreadForMargin(marginId: number): number {
    return this.getTotalUnreadChannelsForMargin(marginId) + this.getUnseenCountForMargin(marginId)
  }

  clearUnreadMessagesForConversation(conversationId: number): void {
    this.state.unreadDirectConversationIds.delete(conversationId)
    this.state.unreadDirectConversationIds = new Set(this.state.unreadDirectConversationIds)

    this.state.unreadChannelConversations.delete(conversationId)
    this.state.unreadChannelConversations = new Map(this.state.unreadChannelConversations)
  }

  clearUnreadMessages(): void {
    this.state.unreadDirectConversationIds = new Set()
    this.state.unreadChannelConversations = new Map()
  }
}

export const notificationState = new NotificationStateManager()
