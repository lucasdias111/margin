import type { UnreadCount } from '$src/interfaces/UnreadCount'
import type { Space } from '$src/interfaces/Space'
import { authenticatedGet } from '$src/services/api'
import { SvelteMap } from 'svelte/reactivity'
import type { Notification } from '$src/interfaces/Notification'

interface NotificationState {
  unreadDirectMessages: UnreadCount[]
  unreadChannelMessages: UnreadCount[]
  unseenAnnouncementCounts: SvelteMap<number, number>
}

class NotificationStateManager {
  private state = $state<NotificationState>({
    unreadDirectMessages: [],
    unreadChannelMessages: [],
    unseenAnnouncementCounts: new SvelteMap()
  })

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

  async loadUnseenAnnouncementCounts(): Promise<void> {
    const res = await authenticatedGet('api/notifications/unseen_counts')
    const data: Record<string, number> = await res.json()
    this.state.unseenAnnouncementCounts = new SvelteMap(
      Object.entries(data).map(([k, v]) => [Number(k), v])
    )
  }

  incrementUnseenAnnouncements(marginId: number): void {
    const current = this.state.unseenAnnouncementCounts.get(marginId) ?? 0
    this.state.unseenAnnouncementCounts.set(marginId, current + 1)
  }
  getTotalUnseenAnnouncements(): number {
    return Array.from(this.state.unseenAnnouncementCounts.values()).reduce(
      (sum, count) => sum + count,
      0
    )
  }

  clearUnseenNotification(notification: Notification): void {
    const current = this.state.unseenAnnouncementCounts.get(notification.marginId) ?? 0
    this.state.unseenAnnouncementCounts.set(notification.marginId, Math.max(0, current - 1))
    notification.seen = true
  }
}

export const notificationState = new NotificationStateManager()
