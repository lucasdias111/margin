import type { ConversationMessagesResponse, Message } from '$src/interfaces/Messages'
import {
  type Conversation,
  type GroupConversation,
  isChannelConversation,
  isDirectConversation,
  isGroupConversation,
  isThreadConversation
} from '$src/interfaces/Conversation'
import type { Channel } from '$src/interfaces/Channel'
import type { User } from '$src/interfaces/User'
import { encryptionService } from './EncryptionService'
import { authenticatedGet, authenticatedPost } from '$src/services/api'
import { notificationService } from '$src/services/NotificationService'
import { sessionState } from '$src/states/SessionState.svelte'
import { conversationsState, defaultMeta } from '$src/states/ConversationsState.svelte.js'
import { threadsState } from '$src/states/ThreadsState.svelte'
import type { UnreadConversations } from '$src/interfaces/UnreadCount'
import { lastMessagePreviewText } from '$src/utils/messagePreview'

function lastMessageOf(messages: Message[]): string | null {
  const last = messages[messages.length - 1]
  return last ? lastMessagePreviewText(last) : null
}

class MessageLoaderService {
  private static readonly PAGE_SIZE = 30

  async loadUnreadConversations(): Promise<void> {
    const response = await authenticatedGet('conversations/unread')
    const unread: UnreadConversations = await response.json()

    for (const id of unread.directConversationIds) {
      conversationsState.markUnread(id)
    }

    for (const id of unread.groupConversationIds ?? []) {
      conversationsState.markUnread(id)
    }

    for (const channel of unread.channelUnreads) {
      if (!conversationsState.byId.has(channel.conversationId)) {
        conversationsState.byId.set(channel.conversationId, {
          id: channel.conversationId,
          type: 'CHANNEL',
          channelId: -1,
          name: '',
          createdAt: new Date().toISOString()
        })
      }
      conversationsState.markUnread(channel.conversationId)
      conversationsState.setMarginForConversation(channel.conversationId, channel.marginId)
    }

    for (const id of unread.threadConversationIds ?? []) {
      threadsState.markUnread(id)
    }
  }

  async loadConversationForUser(user: User, force = false): Promise<void> {
    if (!force) {
      for (const [convId, conv] of conversationsState.byId) {
        if (conv.type === 'DIRECT' && conv.otherUserId === user.id) {
          const meta = conversationsState.conversationMetaById.get(convId)
          if (meta?.initialFetchCompleted && !meta?.isLoading) {
            if (document.hasFocus()) await this.markConversationAsRead(convId)
            return
          }
          break
        }
      }
    }

    await this.loadMessages(
      `conversations/${user.id}/direct_messages?limit=${MessageLoaderService.PAGE_SIZE}`,
      (conv) => (document.hasFocus() ? this.markConversationAsRead(conv.id) : Promise.resolve())
    )
  }

  async loadConversationForGroup(group: GroupConversation, force = false): Promise<void> {
    const meta = conversationsState.conversationMetaById.get(group.id)
    if (!force && meta?.initialFetchCompleted && !meta?.isLoading) {
      if (document.hasFocus()) await this.markConversationAsRead(group.id)
      return
    }

    await this.loadGroupMessages(group)
  }

  async loadConversationForChannel(channel: Channel, force = false): Promise<void> {
    const conversationId = channel.conversationId
    if (!force) {
      const meta = conversationsState.conversationMetaById.get(conversationId)
      if (meta?.initialFetchCompleted && !meta?.isLoading) {
        if (document.hasFocus()) await this.markConversationAsRead(conversationId)
        return
      }
    }

    await this.loadMessages(
      `conversations/${channel.id}/channel_messages?limit=${MessageLoaderService.PAGE_SIZE}`,
      () => (document.hasFocus() ? this.markConversationAsRead(conversationId) : Promise.resolve())
    )
  }

  private async loadGroupMessages(group: GroupConversation): Promise<void> {
    const url = `conversations/${group.id}/messages?limit=${MessageLoaderService.PAGE_SIZE}`
    const response = await authenticatedGet(url)
    if (!response.ok) return

    const messageResponse: ConversationMessagesResponse = await response.json()
    const conv = messageResponse.conversation
    if (!conv) return

    conversationsState.byId.set(conv.id, conv)
    conversationsState.conversationMetaById.set(conv.id, {
      ...(conversationsState.conversationMetaById.get(conv.id) ?? defaultMeta()),
      isLoading: true
    })

    let messages = messageResponse.messages
    if (group.encrypted && sessionState.currentUser) {
      messages = await Promise.all(
        messages.map(async (msg) => {
          try {
            msg.content = await encryptionService.decryptGroupMessage(
              msg.content,
              sessionState.currentUser!.id
            )
          } catch {
            msg.content = '[Decryption failed]'
          }
          return msg
        })
      )
    }

    conversationsState.messagesByConversationId.set(conv.id, messages)
    conversationsState.conversationMetaById.set(conv.id, {
      ...(conversationsState.conversationMetaById.get(conv.id) ?? defaultMeta()),
      isLoading: false,
      hasMore: messages.length >= MessageLoaderService.PAGE_SIZE,
      lastMessage: lastMessageOf(messages),
      initialFetchCompleted: true
    })

    if (document.hasFocus()) await this.markConversationAsRead(conv.id)
  }

  private async loadMessages(
    url: string,
    onLoaded: (conv: Conversation) => Promise<void>
  ): Promise<void> {
    const response = await authenticatedGet(url)
    if (!response.ok) return

    const messageResponse: ConversationMessagesResponse = await response.json()
    const conv = messageResponse.conversation
    if (!conv) return

    const convId = conv.id

    conversationsState.byId.set(convId, conv)

    conversationsState.conversationMetaById.set(convId, {
      ...(conversationsState.conversationMetaById.get(convId) ?? defaultMeta()),
      isLoading: true
    })

    let decryptedMessages: Message[] = []
    try {
      decryptedMessages = await this.decryptIfDirect(messageResponse.messages, conv)
    } catch (error) {
      console.error('Error loading messages:', error)
    }

    conversationsState.messagesByConversationId.set(convId, decryptedMessages)
    conversationsState.conversationMetaById.set(convId, {
      ...(conversationsState.conversationMetaById.get(convId) ?? defaultMeta()),
      isLoading: false,
      hasMore: messageResponse.messages.length >= MessageLoaderService.PAGE_SIZE,
      lastMessage: lastMessageOf(decryptedMessages),
      initialFetchCompleted: true
    })

    await onLoaded(conv)
  }

  async fetchMessagesBefore(
    conv: Conversation,
    beforeId: number
  ): Promise<{ messages: Message[]; hasMore: boolean }> {
    const url = this.buildPaginationUrl(conv, beforeId)
    if (!url) return { messages: [], hasMore: false }

    try {
      const response = await authenticatedGet(url)
      if (!response.ok) return { messages: [], hasMore: false }

      const messageResponse: ConversationMessagesResponse = await response.json()
      let messages = messageResponse.messages

      if (isGroupConversation(conv) && conv.encrypted && sessionState.currentUser) {
        messages = await Promise.all(
          messages.map(async (msg) => {
            try {
              msg.content = await encryptionService.decryptGroupMessage(
                msg.content,
                sessionState.currentUser!.id
              )
            } catch {
              msg.content = '[Decryption failed]'
            }
            return msg
          })
        )
      } else {
        messages = await this.decryptIfDirect(messages, conv)
      }

      const hasMore = messages.length === MessageLoaderService.PAGE_SIZE
      return { messages, hasMore }
    } catch (error) {
      console.error('Error fetching messages:', error)
      return { messages: [], hasMore: false }
    }
  }

  private buildPaginationUrl(conversation: Conversation, before: number): string | null {
    if (isDirectConversation(conversation)) {
      return `conversations/${conversation.otherUserId}/direct_messages?limit=${MessageLoaderService.PAGE_SIZE}&before=${before}`
    }
    if (isGroupConversation(conversation)) {
      return `conversations/${conversation.id}/messages?limit=${MessageLoaderService.PAGE_SIZE}&before=${before}`
    }
    if (isChannelConversation(conversation)) {
      return `conversations/${conversation.channelId}/channel_messages?limit=${MessageLoaderService.PAGE_SIZE}&before=${before}`
    }
    if (isThreadConversation(conversation)) {
      return `conversations/${conversation.id}/messages?limit=${MessageLoaderService.PAGE_SIZE}&before=${before}`
    }
    return null
  }

  private async decryptIfDirect(
    messages: Message[],
    conversation: Conversation
  ): Promise<Message[]> {
    if (!isDirectConversation(conversation) || !conversation.encrypted) return messages

    return Promise.all(
      messages.map(async (message) => {
        try {
          const isRecipient = message.user.id !== sessionState.currentUser.id
          message.content = await encryptionService.decryptMessage(message.content, isRecipient)
          return message
        } catch {
          message.content = '[Decryption failed]'
          return message
        }
      })
    )
  }

  async markConversationAsRead(conversationId: number): Promise<void> {
    if (!conversationId) return
    conversationsState.markRead(conversationId, new Date().toISOString())
    notificationService.dismissNotificationsForConversation(conversationId)
    try {
      await authenticatedPost(null, `conversations/${conversationId}/read`)
    } catch (error) {
      console.error('Failed to mark conversation as read:', error)
    }
  }

  setConversationReadAt(conversationId: number, readAt: string): void {
    const conv = conversationsState.byId.get(conversationId)
    if (!conv) return
    if (conv.type === 'DIRECT') {
      conversationsState.byId.set(conversationId, {
        ...conv,
        otherUserReadAt: readAt
      })
    }

    const meta = conversationsState.conversationMetaById.get(conversationId)
    if (meta) {
      conversationsState.conversationMetaById.set(conversationId, {
        ...meta,
        lastReadAt: readAt,
        unread: false
      })
    }
  }
}

export const messageLoaderService = new MessageLoaderService()
