import type { ConversationMessagesResponse, Message } from '$src/interfaces/Messages'
import type { User } from '$src/interfaces/User'
import {
  isDirectConversation,
  isChannelConversation,
  type Conversation
} from '$src/interfaces/Conversation'
import { encryptionService } from './EncryptionService'
import { webSocketService } from './WebSocketService'
import { WebSocketMessageType } from '$src/interfaces/WebSocketMessageType'
import type { Channel } from '$src/interfaces/Channel'
import { authenticatedGet, authenticatedPost } from '$src/services/api'
import { notificationService } from '$src/services/NotificationService'
import type { WebSocketMessage } from '$src/interfaces/WebSocketMessages'
import { userState } from '$src/states/UserState.svelte'
import { chatState } from '$src/states/ChatState.svelte'
import { conversationState } from '$src/states/ConversationState.svelte'
import { userListState } from '$src/states/UserListState.svelte'
import type { ContentType } from '$src/interfaces/Content'
import { errorService } from '$src/services/ErrorService'

class ChatService {
  private static readonly PAGE_SIZE = 30

  handleIncomingMessage = async (data: WebSocketMessage<Message>): Promise<void> => {
    const msg = data.payload
    notificationService.handleIncomingMessage(msg)
    if (msg.conversationType === 'CHANNEL') {
      await this.handleIncomingChannelMessage(msg)
    } else {
      await this.handleIncomingDirectMessage(msg)
    }
  }

  private handleIncomingChannelMessage = async (msg: Message): Promise<void> => {
    if (msg.conversationId === chatState.selectedChannel?.conversationId) {
      conversationState.messages = [...conversationState.messages, msg]
    }
  }

  private handleIncomingDirectMessage = async (msg: Message): Promise<void> => {
    const isFromMe = msg.user.id === userState.currentUser?.id
    const otherUser = isFromMe ? chatState.selectedUser : msg.user
    const otherUserId = otherUser?.id
    if (!otherUser || !otherUserId) return

    const preview = await encryptionService.decryptMessage(msg.content, !isFromMe)
    await this.ensureUserInRecentList(otherUser, preview, msg, isFromMe)

    const isActiveConversation = conversationState.currentConversation?.id === msg.conversationId
    if (!isActiveConversation) {
      userListState.updateLastMessage(otherUserId, preview, !isFromMe, msg.createdAt)
      return
    }

    try {
      msg.content = await encryptionService.decryptMessage(msg.content, !isFromMe)
    } catch {
      msg.content = '[Decryption failed]'
    }

    if (isFromMe) {
      const optimisticIndex = conversationState.messages.findIndex((m) => m.id < 0)
      if (optimisticIndex !== -1) {
        conversationState.messages[optimisticIndex] = msg
        userListState.updateLastMessage(otherUserId, preview, !isFromMe, msg.createdAt)
        await this.markConversationAsRead(conversationState.currentConversation!.id)
        return
      }
    }

    conversationState.messages = [...conversationState.messages, msg]
    userListState.updateLastMessage(otherUserId, preview, !isFromMe, msg.createdAt)
    await this.markConversationAsRead(conversationState.currentConversation!.id)
  }

  private ensureUserInRecentList = async (
    user: User,
    preview: string,
    msg: Message,
    isFromMe: boolean
  ): Promise<void> => {
    const alreadyInList = userListState.recentUsers.find((u) => u.user.id === user.id)
    if (alreadyInList) return
    userListState.addUser({
      user,
      lastMessage: preview,
      lastMessageTime: msg.createdAt,
      lastMessageIncoming: !isFromMe
    })
  }

  async loadConversationForUser(user: User): Promise<void> {
    if (
      conversationState.currentConversation &&
      isDirectConversation(conversationState.currentConversation) &&
      conversationState.currentConversation.otherUserId === user.id
    )
      return

    await this.loadMessages(
      `conversations/${user.id}/direct_messages?limit=${ChatService.PAGE_SIZE}`,
      (conv) => this.markConversationAsRead(conv.id)
    )
  }

  async loadMessagesForChannel(channel: Channel): Promise<void> {
    if (conversationState.currentConversation?.id === channel.conversationId) return

    await this.loadMessages(
      `conversations/${channel.id}/channel_messages?limit=${ChatService.PAGE_SIZE}`,
      () => this.markConversationAsRead(channel.conversationId)
    )
  }

  private async loadMessages(
    url: string,
    onLoaded: (conv: Conversation) => Promise<void>
  ): Promise<void> {
    conversationState.currentConversation = null
    conversationState.messages = []
    conversationState.hasMore = true
    conversationState.isLoading = true

    try {
      const response = await authenticatedGet(url)
      if (!response.ok) {
        console.error(`Failed to load messages: ${response.status}`)
        return
      }

      const messageResponse: ConversationMessagesResponse = await response.json()
      if (messageResponse.conversation == null) return

      conversationState.selectConversation(messageResponse.conversation)
      conversationState.messages = await this.decryptIfDirect(
        messageResponse.messages,
        messageResponse.conversation
      )

      conversationState.hasMore = messageResponse.messages.length >= ChatService.PAGE_SIZE

      await onLoaded(messageResponse.conversation)
    } catch (error) {
      console.error('Error loading messages:', error)
      conversationState.messages = []
    } finally {
      conversationState.isLoading = false
    }
  }

  async loadMoreMessages(): Promise<void> {
    if (
      conversationState.isLoadingMore ||
      !conversationState.hasMore ||
      !conversationState.currentConversation
    )
      return

    const oldestId = conversationState.messages[0]?.id
    if (!oldestId) return

    conversationState.isLoadingMore = true

    try {
      const url = this.buildPaginationUrl(conversationState.currentConversation, oldestId)
      if (!url) return

      const response = await authenticatedGet(url)
      if (!response.ok) return

      const messageResponse: ConversationMessagesResponse = await response.json()
      if (messageResponse.messages.length === 0) {
        conversationState.hasMore = false
        return
      }

      if (messageResponse.messages.length < ChatService.PAGE_SIZE) {
        conversationState.hasMore = false
      }

      const messages = await this.decryptIfDirect(
        messageResponse.messages,
        conversationState.currentConversation
      )
      conversationState.messages = [...messages, ...conversationState.messages]
    } finally {
      conversationState.isLoadingMore = false
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
          const isRecipient = message.user.id !== userState.currentUser.id
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
      {
        recipientUserId: toUserId,
        encryptedContent: content
      },
      `conversations/create_private`
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
      createdAt: new Date().toISOString()
    }
  }

  async deleteMessage(message: Message): Promise<void> {
    webSocketService.send({
      type: WebSocketMessageType.SEND_DELETE_MESSAGE,
      recipientId: message.conversationId,
      payload: message.id.toString()
    })
    conversationState.deleteMessage(message.id)
  }

  async editMessagePrivateMessage(
    message: Message,
    newContent: string,
    toUserId: number
  ): Promise<void> {
    try {
      const encrypted = await this.encryptForUser(newContent, toUserId, userState.currentUser.id)
      webSocketService.send({
        type: WebSocketMessageType.SEND_EDIT_MESSAGE,
        recipientId: message.conversationId,
        payload: { messageId: message.id, content: encrypted }
      })
    } catch (error) {
      errorService.reportError(error)
    }
  }

  async editChannelMessage(message: Message, newContent: string): Promise<void> {
    webSocketService.send({
      type: WebSocketMessageType.SEND_EDIT_MESSAGE,
      recipientId: message.conversationId,
      payload: { messageId: message.id, content: newContent }
    })
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

  selectContent(content: ContentType): void {
    if (chatState.currentlySelectedContent !== content) {
      chatState.selectedUser = null
      conversationState.clear()
    }
    chatState.currentlySelectedContent = content
    chatState.selectedChannel = null
  }
}

export const chatService = new ChatService()
