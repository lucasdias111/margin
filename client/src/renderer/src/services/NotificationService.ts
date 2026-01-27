import { notificationState } from '$src/states/NotificationState.svelte'
import { chatState } from '$src/states/ChatState.svelte'
import type { ChannelMessage, DirectMessage } from '$src/interfaces/Messages'

class NotificationService {
  handleIncomingDirectMessage(message: DirectMessage): void {
    if (chatState.selectedUser?.id === message.fromUserId) {
      return
    }

    notificationState.addUnreadDirectMessages([message])
  }

  addIncomingDirectMessages(messages: DirectMessage[]): void {
    notificationState.addUnreadDirectMessages(messages)
  }

  handleIncomingChannelMessage(message: ChannelMessage): void {
    if (chatState.selectedChannel?.id === message.channelId) {
      return
    }

    notificationState.addUnreadChannelMessages([message])
  }

  markAsRead(userId: number): void {
    notificationState.clearUnreadDirectMessages(userId)
  }
}

export const notificationService = new NotificationService()
