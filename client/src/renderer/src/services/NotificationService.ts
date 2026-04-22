import { notificationState } from '$src/states/NotificationState.svelte'
import { chatState } from '$src/states/ChatState.svelte'
import { userState } from '$src/states/UserState.svelte'
import type { Message } from '$src/interfaces/Messages'
import type { Notification } from '$src/interfaces/Notification'
import { authenticatedGet, authenticatedPost } from '$src/services/api'
import { NotificationSounds } from '$src/utils/NotificationSounds'
import { marginService } from '$src/services/MarginService'
import { conversationService } from '$src/services/ConversationService'
import type { Channel } from '$src/interfaces/Channel'
import { userService } from '$src/services/UserService'

class NotificationService {
  private sounds: Record<string, HTMLAudioElement> = {}
  private pendingNotifications = new Map<number, globalThis.Notification[]>()

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
    const isWindowFocused = document.hasFocus()

    if (!isActive || !isWindowFocused) {
      this.playSound(NotificationSounds.NEW_MESSAGE)
      this.showSystemNotification(message)
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

  private showSystemNotification(message: Message): void {
    if (!('Notification' in window)) return

    if (Notification.permission === 'granted') {
      this.createNotification(message)
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          this.createNotification(message)
        }
      })
    }
  }

  private createNotification(message: Message): void {
    let title: string = ''
    let content: string = ''
    if (message.conversationType === 'DIRECT') {
      title = message.user.displayName
      content = message.content
    } else {
      title = message.channelName
      content = `${message.user.displayName}: ${message.content}`
    }

    const notification = new Notification(title, {
      body: content,
      silent: true
    })

    const conversationId = message.conversationId
    if (!this.pendingNotifications.has(conversationId)) {
      this.pendingNotifications.set(conversationId, [])
    }
    this.pendingNotifications.get(conversationId)!.push(notification)

    notification.onclose = () => {
      const list = this.pendingNotifications.get(conversationId)
      if (list) {
        const idx = list.indexOf(notification)
        if (idx !== -1) list.splice(idx, 1)
      }
    }

    notification.onclick = async () => {
      window.focus()
      this.clearNotificationsForConversation(conversationId)
      if (message.conversationType === 'CHANNEL') {
        chatState.currentlySelectedContent = 'margin'
        chatState.selectMargin(await marginService.getMargin(message.marginId))
        const channel: Channel = await conversationService.getChannelById(message.conversationId)
        chatState.selectChannel(channel)
      } else {
        chatState.currentlySelectedContent = 'private'
        chatState.selectUser(await userService.getById(message.user.id))
      }
    }
  }

  private clearNotificationsForConversation(conversationId: number): void {
    const list = this.pendingNotifications.get(conversationId)
    if (list) {
      list.forEach((n) => n.close())
      this.pendingNotifications.delete(conversationId)
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
    this.clearNotificationsForConversation(conversationId)
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
