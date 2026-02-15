import type { UnreadCount } from '$src/interfaces/UnreadCount'

interface NotificationState {
  unreadDirectMessages: UnreadCount[]
  unreadChannelMessages: UnreadCount[]
}

class NotificationStateManager {
  private state = $state<NotificationState>({
    unreadDirectMessages: [],
    unreadChannelMessages: []
  })

  addUnreadDirectMessages(directMessages: UnreadCount[]) {
    this.state.unreadDirectMessages = this.state.unreadDirectMessages.concat(directMessages)
  }

  addUnreadChannelMessages(channelMessages: UnreadCount[]) {
    this.state.unreadChannelMessages = this.state.unreadChannelMessages.concat(channelMessages)
  }

  getTotalUnreadDirectMessagesForUser(userId: number): number {
    return this.state.unreadDirectMessages.filter((msg) =>
      msg.fromUserId === userId).length
  }

  getTotalUnreadDirectMessagesForChannel(conversationId: number) {
    return this.state.unreadChannelMessages.filter((msg) =>
      msg.conversationId === conversationId)
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
}

export const notificationState = new NotificationStateManager()
