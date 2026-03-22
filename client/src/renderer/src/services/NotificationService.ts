import { notificationState } from '$src/states/NotificationState.svelte'
import { chatState } from '$src/states/ChatState.svelte'
import { userState } from '$src/states/UserState.svelte'
import type { UnreadCount } from '$src/interfaces/UnreadCount'
import type { Message } from '$src/interfaces/Messages'
import type { Notification } from '$src/interfaces/Notification'
import { authenticatedGet, authenticatedPost } from '$src/services/api'

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
    if (chatState.selectedUser?.id === message.user.id) {
      return
    }

    const unreadCount: UnreadCount = {
      conversationId: message.conversationId,
      fromUserId: message.user.id,
      unreadDmsCount: 1,
      unreadChannelsCount: 0,
      marginId: -1
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
      unreadChannelsCount: 1,
      marginId: message.marginId ?? -1
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
      unreadChannelsCount: 1,
      marginId: message.marginId ?? -1
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

  async getAll(): Promise<Notification[]> {
    const res = await authenticatedGet('notifications/all')
    return res.json()
  }

  async markNotificationAsSeen(notification: Notification): Promise<void> {
    await authenticatedPost(notification.notificationId, 'notifications/mark_seen')
    notificationState.clearUnseenNotification(notification)
  }
}

export const notificationService = new NotificationService()
