import type { ConversationMessagesResponse, Message, MessageReaction } from '$src/interfaces/Messages'
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
        const meta = conversationsState.conversationMetaById.get(msg.conversationId)
        if (meta?.unread) await this.markConversationAsRead(msg.conversationId)
      }
      return
    }

    conversationsState.appendMessage(msg, !isFromMe)

    if (isFromMe) return

    if (isActive && document.hasFocus()) {
      await this.markConversationAsRead(msg.conversationId)
    } else {
      conversationsState.markUnread(msg.conversationId)
      if (!isActive) notificationService.handleIncomingMessage(msg)
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
      if (document.hasFocus() && isActive) {
        const meta = conversationsState.conversationMetaById.get(msg.conversationId)
        if (meta?.unread) await this.markConversationAsRead(msg.conversationId)
      }
      return
    }

    conversationsState.appendMessage(msg, !isFromMe)

    if (isActive && document.hasFocus()) {
      await this.markConversationAsRead(msg.conversationId)
    } else {
      conversationsState.markUnread(msg.conversationId)
      if (!isActive) notificationService.handleIncomingMessage(msg)
    }
  }

  private replaceOptimisticIfPresent(msg: Message): boolean {
    const messages = conversationsState.messagesByConversationId.get(msg.conversationId) ?? []
    const optimisticIndex = messages.findIndex((m) => m.id < 0)
    if (optimisticIndex === -1) return false

    const updated = [...messages]
    updated[optimisticIndex] = msg
    conversationsState.messagesByConversationId.set(msg.conversationId, updated)
    const meta = conversationsState.conversationMetaById.get(msg.conversationId) ?? defaultMeta()
    conversationsState.conversationMetaById.set(msg.conversationId, {
      ...meta,
      lastMessage: msg.content,
      lastMessageTime: msg.createdAt,
      lastMessageIncoming: false
    })

    return true
  }

  async loadConversationForUser(user: User, force = false): Promise<void> {
    if (!force) {
      for (const [convId, conv] of conversationsState.byId) {
        if (conv.type === 'DIRECT' && conv.otherUserId === user.id) {
          const messages = conversationsState.messagesByConversationId.get(convId)
          const meta = conversationsState.conversationMetaById.get(convId)
          if (messages && messages.length > 1 && !meta?.isLoading) {
            if (document.hasFocus()) await this.markConversationAsRead(convId)
            return
          }
          break
        }
      }
    }

    await this.loadMessages(
      `conversations/${user.id}/direct_messages?limit=${ChatService.PAGE_SIZE}`,
      (conv) => (document.hasFocus() ? this.markConversationAsRead(conv.id) : Promise.resolve())
    )
  }

  async loadConversationForChannel(channel: Channel, force = false): Promise<void> {
    const conversationId = channel.conversationId
    if (!force) {
      const existing = conversationsState.messagesByConversationId.get(conversationId)
      const meta = conversationsState.conversationMetaById.get(conversationId)
      if (existing && existing.length > 1 && !meta?.isLoading) {
        if (document.hasFocus()) await this.markConversationAsRead(conversationId)
        return
      }
    }

    await this.loadMessages(
      `conversations/${channel.id}/channel_messages?limit=${ChatService.PAGE_SIZE}`,
      () => (document.hasFocus() ? this.markConversationAsRead(conversationId) : Promise.resolve())
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

      conversationsState.conversationMetaById.set(convId, {
        ...(conversationsState.conversationMetaById.get(convId) ?? defaultMeta()),
        isLoading: true
      })

      const decryptedMessages = await this.decryptIfDirect(messageResponse.messages, conv)

      conversationsState.messagesByConversationId.set(convId, decryptedMessages)
      conversationsState.conversationMetaById.set(convId, {
        ...(conversationsState.conversationMetaById.get(convId) ?? defaultMeta()),
        isLoading: false,
        hasMore: messageResponse.messages.length >= ChatService.PAGE_SIZE,
        lastMessage: decryptedMessages[decryptedMessages.length - 1]?.content ?? null
      })

      await onLoaded(conv)
    } catch (error) {
      console.error('Error loading messages:', error)
    }
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
      const messages = await this.decryptIfDirect(messageResponse.messages, conv)
      const hasMore = messages.length === ChatService.PAGE_SIZE
      return { messages, hasMore }
    } catch (error) {
      console.error('Error fetching messages:', error)
      return { messages: [], hasMore: false }
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
    const convId = conversationsState.currentConversation.id
    const messages = conversationsState.messagesByConversationId.get(convId)
    if (!messages) return

    const index = messages.findIndex((m) => m.id === reaction.messageId)
    if (index === -1) return

    const updatedMessage = { ...messages[index] }

    const already = updatedMessage.reactions.some(
      (r) => r.userId === reaction.userId && r.emoji === reaction.emoji
    )

    if (!already) {
      updatedMessage.reactions = [...updatedMessage.reactions, reaction]
      const updatedMessages = [...messages]
      updatedMessages[index] = updatedMessage
      conversationsState.messagesByConversationId.set(convId, updatedMessages)
    }
  }

  handleIncomingReactionRemoved = (reaction: MessageReaction): void => {
    const convId = conversationsState.currentConversation.id
    const messages = conversationsState.messagesByConversationId.get(convId)
    if (!messages) return

    const index = messages.findIndex((m) => m.id === reaction.messageId)
    if (index === -1) return

    const updatedMessage = { ...messages[index] }
    updatedMessage.reactions = updatedMessage.reactions.filter(
      (r) => !(r.userId === reaction.userId && r.emoji === reaction.emoji)
    )

    const updatedMessages = [...messages]
    updatedMessages[index] = updatedMessage
    conversationsState.messagesByConversationId.set(convId, updatedMessages)
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

  handleIncomingConversationInvite = (data: WebSocketMessage<PendingInvite>): void => {
    conversationInviteService.addPendingInvite(data.payload)
  }

  handleConversationInviteAccepted = (
    data: WebSocketMessage<{ conversation: DirectConversation; acceptedBy: User }>
  ): void => {
    const { conversation, acceptedBy } = data.payload

    usersState.add(acceptedBy)

    const accepted: DirectConversation = {
      ...conversation,
      otherUserId: acceptedBy.id,
      inviteStatus: 'ACCEPTED'
    }
    conversationsState.byId.set(accepted.id, accepted)

    if (!conversationsState.conversationMetaById.has(accepted.id)) {
      conversationsState.conversationMetaById.set(accepted.id, defaultMeta())
    }
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
      otherUserId: invite.fromUser.id,
      inviteStatus: 'ACCEPTED'
    }
    conversationsState.byId.set(accepted.id, accepted)

    if (!conversationsState.conversationMetaById.has(accepted.id)) {
      conversationsState.conversationMetaById.set(accepted.id, defaultMeta())
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

export const chatService = new ChatService()
