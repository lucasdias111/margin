import type {
  ConversationMessagesResponse,
  Message,
  MessageReaction
} from '$src/interfaces/Messages'
import type { User } from '$src/interfaces/User'
import {
  type Conversation,
  type DirectConversation,
  isChannelConversation,
  isDirectConversation
} from '$src/interfaces/Conversation'
import { encryptionService } from './EncryptionService'
import { webSocketService } from './WebSocketService'
import { WebSocketMessageType } from '$src/interfaces/WebSocketMessageType'
import type { Channel } from '$src/interfaces/Channel'
import { authenticatedGet, authenticatedPost } from '$src/services/api'
import { notificationService } from '$src/services/NotificationService'
import type { WebSocketMessage } from '$src/interfaces/WebSocketMessages'
import type { View } from '$src/interfaces/View'
import { navigationState } from '$src/states/NavigationState.svelte'
import { navigationService } from '$src/services/NavigationService'
import { channelService } from '$src/services/ChannelService'
import { sessionState } from '$src/states/SessionState.svelte'
import { conversationsState, defaultMeta } from '$src/states/ConversationsState.svelte.js'
import { conversationInviteService, type PendingInvite } from '$src/states/UserListState.svelte'
import { usersState } from '$src/states/UsersState.svelte'

class ChatService {
  private static readonly PAGE_SIZE = 30

  handleIncomingMessage = async (data: WebSocketMessage<Message>): Promise<void> => {
    const msg = data.payload
    if (msg.conversationType === 'CHANNEL') {
      await this.handleIncomingChannelMessage(msg)
      notificationService.handleIncomingMessage(msg)
    } else {
      await this.handleIncomingDirectMessage(msg)
    }
  }

  private handleIncomingChannelMessage = async (msg: Message): Promise<void> => {
    const isFromMe = msg.user.id === sessionState.currentUser?.id
    const isActive = msg.conversationId === navigationState.selectedChannel?.conversationId

    if (isFromMe && this.replaceOptimisticIfPresent(msg)) {
      if (isActive && document.hasFocus()) {
        await this.markConversationAsRead(msg.conversationId)
      }
      return
    }

    conversationsState.appendMessage(msg, !isFromMe)

    if (!isActive) {
      notificationService.handleIncomingMessage(msg)
    } else if (document.hasFocus()) {
      await this.markConversationAsRead(msg.conversationId)
    }
  }

  private handleIncomingDirectMessage = async (msg: Message): Promise<void> => {
    const isFromMe = msg.user.id === sessionState.currentUser?.id
    const otherUser = isFromMe ? navigationState.selectedUser : msg.user
    const otherUserId = otherUser?.id

    if (!otherUser || !otherUserId) return

    try {
      msg.content = await encryptionService.decryptMessage(msg.content, !isFromMe)
    } catch {
      msg.content = '[Decryption failed]'
    }

    const isActive = navigationState.selectedUser?.id === otherUserId

    if (isFromMe && this.replaceOptimisticIfPresent(msg)) {
      if (document.hasFocus()) {
        await this.markConversationAsRead(msg.conversationId)
      }
      return
    }

    conversationsState.appendMessage(msg, !isFromMe)

    if (!isActive) {
      notificationService.handleIncomingMessage(msg)
    } else if (document.hasFocus()) {
      await this.markConversationAsRead(msg.conversationId)
    }
  }

  private replaceOptimisticIfPresent(msg: Message): boolean {
    const messages = conversationsState.messagesByConversationId.get(msg.conversationId) ?? []
    const optimisticIndex = messages.findIndex((m) => m.id < 0)
    if (optimisticIndex === -1) return false

    const updated = [...messages]
    updated[optimisticIndex] = msg
    conversationsState.messagesByConversationId.set(msg.conversationId, updated)
    conversationsState.messagesByConversationId = new Map(
      conversationsState.messagesByConversationId
    )

    const meta = conversationsState.conversationMetaById.get(msg.conversationId) ?? defaultMeta()
    conversationsState.conversationMetaById.set(msg.conversationId, {
      ...meta,
      lastMessage: msg.content,
      lastMessageTime: msg.createdAt,
      lastMessageIncoming: false
    })
    conversationsState.conversationMetaById = new Map(conversationsState.conversationMetaById)

    return true
  }

  async loadConversationForUser(user: User, force = false): Promise<void> {
    if (!force) {
      for (const [convId, conv] of conversationsState.byId) {
        if (conv.type === 'DIRECT' && conv.otherUserId === user.id) {
          const existing = conversationsState.messagesByConversationId.get(convId)
          if (existing && existing.length > 0) return
          break
        }
      }
    }

    await this.loadMessages(
      `conversations/${user.id}/direct_messages?limit=${ChatService.PAGE_SIZE}`,
      (conv) => this.markConversationAsRead(conv.id)
    )
  }

  async loadConversationForChannel(channel: Channel, force = false): Promise<void> {
    if (!force) {
      const existing = conversationsState.messagesByConversationId.get(channel.conversationId)
      if (existing && existing.length > 0) return
    }

    await this.loadMessages(
      `conversations/${channel.id}/channel_messages?limit=${ChatService.PAGE_SIZE}`,
      () => this.markConversationAsRead(channel.conversationId)
    )
  }

  private async loadMessages(
    url: string,
    onLoaded: (conv: Conversation) => Promise<void>
  ): Promise<void> {
    try {
      const response = await authenticatedGet(url)
      if (!response.ok) return

      const messageResponse: ConversationMessagesResponse = await response.json()
      const conv = messageResponse.conversation
      if (!conv) return

      const convId = conv.id

      conversationsState.byId.set(convId, conv)
      conversationsState.byId = new Map(conversationsState.byId)

      const meta = conversationsState.conversationMetaById.get(convId) ?? defaultMeta()
      conversationsState.conversationMetaById.set(convId, { ...meta, isLoading: true })
      conversationsState.conversationMetaById = new Map(conversationsState.conversationMetaById)

      const decryptedMessages = await this.decryptIfDirect(messageResponse.messages, conv)

      conversationsState.messagesByConversationId.set(convId, decryptedMessages)
      conversationsState.messagesByConversationId = new Map(
        conversationsState.messagesByConversationId
      )

      conversationsState.conversationMetaById.set(convId, {
        ...meta,
        isLoading: false,
        hasMore: messageResponse.messages.length >= ChatService.PAGE_SIZE,
        lastMessage: decryptedMessages[decryptedMessages.length - 1]?.content ?? null
      })
      conversationsState.conversationMetaById = new Map(conversationsState.conversationMetaById)

      await onLoaded(conv)
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  async loadMoreMessages(): Promise<void> {
    const conv = conversationsState.currentConversation
    if (!conv) return

    const meta = conversationsState.conversationMetaById.get(conv.id) ?? defaultMeta()
    const currentMessages = conversationsState.messagesByConversationId.get(conv.id) ?? []

    if (meta.isLoading || !meta.hasMore) return

    const oldestId = currentMessages[0]?.id
    if (!oldestId) return

    conversationsState.conversationMetaById.set(conv.id, { ...meta, isLoading: true })

    try {
      const url = this.buildPaginationUrl(conv, oldestId)
      if (!url) return

      const response = await authenticatedGet(url)
      if (!response.ok) return

      const messageResponse: ConversationMessagesResponse = await response.json()

      const newMessages = await this.decryptIfDirect(messageResponse.messages, conv)
      const hasMore = newMessages.length === ChatService.PAGE_SIZE

      conversationsState.messagesByConversationId.set(conv.id, [...newMessages, ...currentMessages])

      conversationsState.conversationMetaById.set(conv.id, {
        ...meta,
        isLoading: false,
        hasMore
      })
    } catch (error) {
      console.error('Error loading more messages:', error)
      conversationsState.conversationMetaById.set(conv.id, { ...meta, isLoading: false })
    }
  }

  private buildPaginationUrl(conversation: Conversation, before: number): string | null {
    if (isDirectConversation(conversation)) {
      return `conversations/${conversation.otherUserId}/direct_messages?limit=${ChatService.PAGE_SIZE}&before=${before}`
    }
    if (isChannelConversation(conversation)) {
      return `conversations/${conversation.channelId}/channel_messages?limit=${ChatService.PAGE_SIZE}&before=${before}`
    }
    return null
  }

  private async decryptIfDirect(
    messages: Message[],
    conversation: Conversation
  ): Promise<Message[]> {
    if (!isDirectConversation(conversation)) return messages

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

  async sendMessageAndStartConversation(
    currentUser: User,
    toUserId: number,
    messageText: string
  ): Promise<{ conversation: Conversation; message: Message }> {
    const content = await this.encryptForUser(messageText, toUserId, currentUser.id)
    const response = await authenticatedPost(
      { recipientUserId: toUserId, encryptedContent: content },
      'conversations/create_private'
    )
    const conversation: Conversation = await response.json()
    const message = this.buildOptimisticMessage(currentUser, conversation.id, messageText, 'DIRECT')

    return { conversation, message }
  }

  async sendMessage(
    currentUser: User,
    conversation: Conversation,
    messageText: string
  ): Promise<Message> {
    let content = messageText
    if (isDirectConversation(conversation)) {
      content = await this.encryptForUser(messageText, conversation.otherUserId, currentUser.id)
    }
    webSocketService.send<string>({
      type: WebSocketMessageType.SEND_MESSAGE,
      recipientId: conversation.id,
      payload: content
    })
    return this.buildOptimisticMessage(currentUser, conversation.id, messageText, 'DIRECT')
  }

  async sendChannelMessage(
    currentUser: User,
    channel: Channel,
    messageText: string
  ): Promise<Message> {
    webSocketService.send<string>({
      type: WebSocketMessageType.SEND_MESSAGE,
      recipientId: channel.conversationId,
      payload: messageText
    })
    return this.buildOptimisticMessage(currentUser, channel.conversationId, messageText, 'CHANNEL')
  }

  private async encryptForUser(
    text: string,
    recipientId: number,
    senderId: number
  ): Promise<string> {
    const recipientPublicKey = await encryptionService.getPublicKey(recipientId)
    const myPublicKey = await encryptionService.getPublicKey(senderId)
    return encryptionService.encryptMessage(text, recipientPublicKey, myPublicKey)
  }

  private buildOptimisticMessage(
    user: User,
    conversationId: number | null,
    content: string,
    conversationType: 'DIRECT' | 'CHANNEL'
  ): Message {
    return {
      id: -Date.now(),
      conversationId,
      user,
      content,
      conversationType,
      isEdited: false,
      createdAt: new Date().toISOString(),
      reactions: []
    }
  }

  async deleteMessage(message: Message): Promise<void> {
    webSocketService.send({
      type: WebSocketMessageType.SEND_DELETE_MESSAGE,
      recipientId: message.conversationId,
      payload: message.id.toString()
    })
    conversationsState.deleteMessage(message)
  }

  async editMessagePrivateMessage(
    message: Message,
    newContent: string,
    toUserId: number
  ): Promise<void> {
    const encrypted = await this.encryptForUser(newContent, toUserId, sessionState.currentUser.id)
    webSocketService.send({
      type: WebSocketMessageType.SEND_EDIT_MESSAGE,
      recipientId: message.conversationId,
      payload: { messageId: message.id, content: encrypted }
    })
  }

  async editChannelMessage(message: Message, newContent: string): Promise<void> {
    webSocketService.send({
      type: WebSocketMessageType.SEND_EDIT_MESSAGE,
      recipientId: message.conversationId,
      payload: { messageId: message.id, content: newContent }
    })
  }

  addReaction(message: Message, emoji: string): void {
    webSocketService.send({
      type: WebSocketMessageType.SEND_ADD_REACTION,
      recipientId: message.conversationId,
      payload: { messageId: message.id, emoji }
    })
  }

  removeReaction(message: Message, emoji: string): void {
    webSocketService.send({
      type: WebSocketMessageType.SEND_REMOVE_REACTION,
      recipientId: message.conversationId,
      payload: { messageId: message.id, emoji }
    })
  }

  handleIncomingReactionAdded = (reaction: MessageReaction): void => {
    const message = conversationsState.messagesByConversationId
      .get(conversationsState.currentConversation.id)
      .find((m) => m?.id === reaction.messageId)
    if (!message) return
    const already = message.reactions.some(
      (r) => r.userId === reaction.userId && r.emoji === reaction.emoji
    )
    if (!already) {
      message.reactions = [...message.reactions, reaction]
    }
  }

  handleIncomingReactionRemoved = (reaction: MessageReaction): void => {
    const message = conversationsState.messagesByConversationId
      .get(conversationsState.currentConversation.id)
      .find((m) => m?.id === reaction.messageId)
    if (!message) return
    message.reactions = message.reactions.filter(
      (r) => !(r.userId === reaction.userId && r.emoji === reaction.emoji)
    )
  }

  async markConversationAsRead(conversationId: number): Promise<void> {
    if (!conversationId) return
    try {
      await authenticatedPost(null, `conversations/${conversationId}/read`)
      notificationService.markConversationAsRead(conversationId)
    } catch (error) {
      console.error('Failed to mark conversation as read:', error)
    }
  }

  handleIncomingConversationInvite = (data: WebSocketMessage<PendingInvite>): void => {
    conversationInviteService.addPendingInvite(data.payload)
  }

  async sendConversationInvite(handle: string): Promise<void> {
    await authenticatedPost({ handle }, 'conversations/invite')
  }

  async acceptConversationInvite(invite: PendingInvite): Promise<void> {
    await authenticatedPost(null, `conversations/${invite.conversation.id}/invite/accept`)

    conversationInviteService.removePendingInvite(invite.conversation.id)

    usersState.add(invite.fromUser)

    const accepted: DirectConversation = {
      ...invite.conversation,
      inviteStatus: 'ACCEPTED'
    }
    conversationsState.byId.set(accepted.id, accepted)
    conversationsState.byId = new Map(conversationsState.byId)

    if (!conversationsState.conversationMetaById.has(accepted.id)) {
      conversationsState.conversationMetaById.set(accepted.id, defaultMeta())
      conversationsState.conversationMetaById = new Map(conversationsState.conversationMetaById)
    }
  }

  async declineConversationInvite(conversationId: number): Promise<void> {
    await authenticatedPost(null, `conversations/${conversationId}/invite/decline`)
    conversationInviteService.removePendingInvite(conversationId)
  }

  async loadPendingInvites(): Promise<void> {
    try {
      const response = await authenticatedGet('conversations/pending_invites')
      if (!response.ok) return
      const invites: PendingInvite[] = await response.json()
      invites.forEach((invite) => conversationInviteService.addPendingInvite(invite))
    } catch (error) {
      console.error('Failed to load pending invites:', error)
    }
  }

  selectContent(content: View): void {
    if (navigationState.view !== content) {
      navigationState.selectedUser = null
      // conversationsState.clear()
    }
    navigationService.setView(content)
    channelService.select(null)
  }

  setConversationReadAt(conversationId: number, readAt: string): void {
    const conv = conversationsState.currentConversation
    if (conv?.type !== 'DIRECT' || conv.id !== conversationId) return
    conv.otherUserReadAt = readAt
  }
}

export const chatService = new ChatService()
