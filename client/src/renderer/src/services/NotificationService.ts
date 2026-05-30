import { notificationState } from '$src/states/NotificationState.svelte'
import { sessionState } from '$src/states/SessionState.svelte'
import type { Message } from '$src/interfaces/Messages'
import type { Notification } from '$src/interfaces/Notification'
import { authenticatedGet, authenticatedPost } from '$src/services/api'
import { NotificationSounds } from '$src/utils/NotificationSounds'
import { marginService } from '$src/services/MarginService'
import type { Channel } from '$src/interfaces/Channel'
import { usersService } from '$src/services/UsersService'
import { View } from '$src/interfaces/View'
import { channelService } from '$src/services/ChannelService'
import { navigationService } from '$src/services/NavigationService'
import { conversationsState } from '$src/states/ConversationsState.svelte'
import { isChannelConversation, isDirectConversation } from '$src/interfaces/Conversation'
import type { Space } from '$src/interfaces/Space'

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

  notifyIncomingMessage = (message: Message): void => {
    if (message.user.id === sessionState.currentUser?.id) return

    this.playSound(NotificationSounds.NEW_MESSAGE)

    if (!document.hasFocus()) {
      this.showSystemNotification(message)
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
    let title: string
    let content: string
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
        navigationService.setView(View.Margin)
        marginService.select(await marginService.getMargin(message.marginId))
        try {
          const channel: Channel = await channelService.getChannelById(message.conversationId)
          channelService.select(channel)
        } catch {
          // Channel was deleted — leave the user on the margin view.
        }
      } else {
        navigationService.setView(View.Private)
        usersService.select(await usersService.getById(message.user.id))
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

  dismissNotificationsForConversation(conversationId: number): void {
    this.clearNotificationsForConversation(conversationId)
  }

  isUnread(conversationId: number): boolean {
    return conversationsState.conversationMetaById.get(conversationId)?.unread === true
  }

  totalUnreadDirectMessages(): number {
    let count = 0
    for (const [conversationId, meta] of conversationsState.conversationMetaById) {
      if (!meta.unread) continue
      const conversation = conversationsState.byId.get(conversationId)
      if (conversation && isDirectConversation(conversation)) count++
    }
    return count
  }

  totalUnreadChannelMessages(): number {
    let count = 0
    for (const [conversationId, meta] of conversationsState.conversationMetaById) {
      if (!meta.unread) continue
      const conversation = conversationsState.byId.get(conversationId)
      if (conversation && isChannelConversation(conversation)) count++
    }
    return count
  }

  totalUnreadMessagesForSpace(space: Space): number {
    return space.channels.filter((ch) => this.isUnread(ch.conversationId)).length
  }

  totalUnreadForMargin(marginId: number): number {
    let count = 0
    for (const [conversationId, meta] of conversationsState.conversationMetaById) {
      if (!meta.unread) continue
      if (conversationsState.marginIdByConversationId.get(conversationId) === marginId) count++
    }
    return count
  }

  async getAll(): Promise<Notification[]> {
    const response = await authenticatedGet('notifications/all')
    return response.json()
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
