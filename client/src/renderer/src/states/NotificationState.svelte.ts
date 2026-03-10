import type { UnreadCount } from '$src/interfaces/UnreadCount'
import type { Space } from '$src/interfaces/Space'
import { authenticatedGet } from '$src/services/api'
import { SvelteMap } from 'svelte/reactivity'

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
    const res = await authenticatedGet('api/notifications/unseen-counts')
    const data: Record<string, number> = await res.json()
    console.log(data)
    this.state.unseenAnnouncementCounts = new SvelteMap(
      Object.entries(data).map(([k, v]) => [Number(k), v])
    )
  }

  incrementUnseenAnnouncements(marginId: number): void {
    const current = this.state.unseenAnnouncementCounts.get(marginId) ?? 0
    this.state.unseenAnnouncementCounts.set(marginId, current + 1)
  }

  clearUnseenAnnouncementsForMargin(marginId: number): void {
    this.state.unseenAnnouncementCounts.delete(marginId)
  }

  getTotalUnseenAnnouncements(): number {
    return Array.from(this.state.unseenAnnouncementCounts.values()).reduce(
      (sum, count) => sum + count,
      0
    )
  }

  getUnseenAnnouncementsForMargin(marginId: number): number {
    return this.state.unseenAnnouncementCounts.get(marginId) ?? 0
  }
}

export const notificationState = new NotificationStateManager()
