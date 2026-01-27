import type { ChannelMessage, DirectMessage } from '$src/interfaces/Messages'

interface NotificationState {
  unreadDirectMessages: DirectMessage[]
  unreadChannelMessages: ChannelMessage[]
}

class NotificationStateManager {
  private state = $state<NotificationState>({
    unreadDirectMessages: [],
    unreadChannelMessages: []
  })

  addUnreadDirectMessages(directMessages: DirectMessage[]) {
    this.state.unreadDirectMessages = this.state.unreadDirectMessages.concat(directMessages)
  }

  getTotalUnreadDirectMessagesForUser(userId: number): number {
    return this.state.unreadDirectMessages.filter((msg) => msg.fromUserId === userId).length
  }

  clearUnreadDirectMessages(userId: number): void {
    this.state.unreadDirectMessages = this.state.unreadDirectMessages.filter(
      (msg) => msg.fromUserId !== userId
    )
  }

  getTotalUnreadDirectMessages(): number {
    return this.state.unreadDirectMessages.length
  }

  addUnreadChannelMessages(channelMessages: ChannelMessage[]) {
    this.state.unreadChannelMessages = this.state.unreadChannelMessages.concat(channelMessages)
  }
}

export const notificationState = new NotificationStateManager()
