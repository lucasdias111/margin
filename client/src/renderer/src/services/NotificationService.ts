import { notificationState } from '$src/states/NotificationState.svelte'
import { chatState } from '$src/states/ChatState.svelte'
import { userState } from '$src/states/UserState.svelte'
import type { Message } from '$src/interfaces/Messages'
import type { Notification } from '$src/interfaces/Notification'
import { authenticatedGet, authenticatedPost } from '$src/services/api'
import { NotificationSounds } from '$src/utils/NotificationSounds'

class NotificationService {
  private sounds: Record<string, HTMLAudioElement> = {}

  private getSound(path: string): HTMLAudioElement {
    if (!this.sounds[path]) {
      this.sounds[path] = new Audio(path)
      this.sounds[path].volume = 0.7
    }
    return this.sounds[path]
  }

  playSound(path: string, loop = false): void {
    const sound = this.getSound(path)
    sound.loop = loop
    sound.currentTime = 0
    sound.play().catch(() => {})
  }

  stopSound(path: string): void {
    const sound = this.sounds[path]
    if (!sound) return
    sound.pause()
    sound.currentTime = 0
  }

  handleIncomingMessage = (message: Message): void => {
    if (message.user.id === userState.currentUser.id) return

    const isActive = this.isActiveConversation(message)

    if (!isActive) {
      this.playSound(NotificationSounds.NEW_MESSAGE)
    }

    switch (message.conversationType) {
      case 'DIRECT':
        if (!isActive) this.addDirectUnread(message)
        break
      case 'CHANNEL':
      case 'GROUP':
        if (!isActive) this.addChannelUnread(message)
        break
    }
  }

  private isActiveConversation(message: Message): boolean {
    switch (message.conversationType) {
      case 'DIRECT':
        return chatState.selectedUser?.id === message.user.id
      case 'CHANNEL':
      case 'GROUP':
        return chatState.selectedChannel?.conversationId === message.conversationId
      default:
        return false
    }
  }

  private addDirectUnread(message: Message): void {
    notificationState.addUnreadDirectConversations([message.conversationId])
  }

  private addChannelUnread(message: Message): void {
    notificationState.addUnreadChannelConversations([
      { conversationId: message.conversationId, marginId: message.marginId ?? -1 }
    ])
  }

  addIncomingDirectConversations(conversationIds: number[]): void {
    notificationState.addUnreadDirectConversations(conversationIds)
  }

  addIncomingChannelConversations(channels: { conversationId: number; marginId: number }[]): void {
    notificationState.addUnreadChannelConversations(channels)
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
    notificationState.markNotificationSeen(notification.notificationId)
  }

  async loadAll(): Promise<void> {
    const result = await this.getAll()
    notificationState.setNotifications(result)
  }
}

export const notificationService = new NotificationService()
