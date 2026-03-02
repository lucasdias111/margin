import { notificationState } from '$src/states/NotificationState.svelte'
import { chatState } from '$src/states/ChatState.svelte'
import { userState } from '$src/states/UserState.svelte'
import type { UnreadCount } from '$src/interfaces/UnreadCount'
import type { Message } from '$src/interfaces/Messages'

class NotificationService {
  handleIncomingMessage(message: Message): void {
    if (message.user.id === userState.currentUser.id) {
      return
    }

    switch (message.conversationType) {
      case 'DIRECT':
        this.handleIncomingDirectMessage(message)
        break
      case 'CHANNEL':
        this.handleIncomingChannelMessage(message)
        break
      case 'GROUP':
        this.handleIncomingGroupMessage(message)
        break
    }
  }

  private handleIncomingDirectMessage(message: Message): void {
    const unreadCount: UnreadCount = {
      conversationId: message.conversationId,
      fromUserId: message.user.id,
      unreadDmsCount: 1,
      unreadChannelsCount: 0
    }

    notificationState.addUnreadDirectMessages([unreadCount])
  }

  private handleIncomingChannelMessage(message: Message): void {
    if (chatState.selectedChannel?.conversationId === message.conversationId) {
      return
    }

    const unreadCount: UnreadCount = {
      conversationId: message.conversationId,
      fromUserId: message.user.id,
      unreadDmsCount: 0,
      unreadChannelsCount: 1
    }

    notificationState.addUnreadChannelMessages([unreadCount])
  }

  private handleIncomingGroupMessage(message: Message): void {
    if (chatState.selectedChannel?.conversationId === message.conversationId) {
      return
    }

    const unreadCount: UnreadCount = {
      conversationId: message.conversationId,
      fromUserId: message.user.id,
      unreadDmsCount: 0,
      unreadChannelsCount: 1
    }

    notificationState.addUnreadChannelMessages([unreadCount])
  }

  addIncomingDirectMessages(messages: UnreadCount[]): void {
    notificationState.addUnreadDirectMessages(messages)
  }

  addIncomingChannelMessages(messages: UnreadCount[]): void {
    notificationState.addUnreadChannelMessages(messages)
  }

  markConversationAsRead(conversationId: number): void {
    notificationState.clearUnreadMessagesForConversation(conversationId)
  }
}

export const notificationService = new NotificationService()
