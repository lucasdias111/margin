import type { ConversationMessagesResponse, Message } from '$src/interfaces/Messages'
import type { User } from '$src/interfaces/User'
import { isDirectConversation, type Conversation } from '$src/interfaces/Conversation'
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
  handleIncomingMessage = async (data: WebSocketMessage<Message>): Promise<void> => {
    const msg = data.payload
    notificationService.handleIncomingMessage(msg)

    if (msg.conversationType === 'CHANNEL') {
      await this.handleIncomingChannelMessage(msg)
      return
    }

    await this.handleIncomingDirectMessage(msg)
  }

  async loadConversationForUser(user: User): Promise<void> {
    if (
      conversationState.currentConversation &&
      isDirectConversation(conversationState.currentConversation) &&
      conversationState.currentConversation.otherUserId === user.id
    )
      return
    conversationState.currentConversation = null
    conversationState.messages = []
    conversationState.isLoading = true

    try {
      const response = await authenticatedGet(
        `api/conversations/${user.id}/direct_messages?limit=100`
      )

      if (!response.ok) {
        console.error('Failed to load messages')
        return
      }

      const messageResponse: ConversationMessagesResponse = await response.json()

      if (messageResponse.conversation == null) return

      conversationState.selectConversation(messageResponse.conversation)
      conversationState.messages = await Promise.all(
        messageResponse.messages.map(async (message) => {
          try {
            const isRecipient = message.user.id !== userState.currentUser.id
            message.content = await encryptionService.decryptMessage(message.content, isRecipient)
            return message
          } catch (decryptError) {
            console.error('Failed to decrypt message:', decryptError)
            message.content = '[Decryption failed]'
            return message
          }
        })
      )

      await this.markConversationAsRead(conversationState.currentConversation.id)
    } catch (error) {
      console.error('Error loading messages:', error)
      conversationState.messages = []
    } finally {
      conversationState.isLoading = false
    }
  }

  async loadMessagesForChannel(channel: Channel): Promise<void> {
    if (conversationState.currentConversation?.id === channel.conversationId) return

    conversationState.messages = []
    conversationState.isLoading = true

    try {
      const response = await authenticatedGet(`api/conversations/${channel.id}/channel_messages`)

      if (!response.ok) {
        console.error(`Request failed with status: ${response.status}`)
        return
      }

      const messageResponse: ConversationMessagesResponse = await response.json()
      conversationState.messages = messageResponse.messages
      conversationState.selectConversation(messageResponse.conversation)

      await this.markConversationAsRead(channel.conversationId)
    } catch (error) {
      console.error('Error loading channel messages:', error)
      conversationState.messages = []
    } finally {
      conversationState.isLoading = false
    }
  }

  async sendMessageAndStartConversation(
    currentUser: User,
    toUserId: number,
    messageText: string
  ): Promise<Message> {
    const recipientPublicKey = await encryptionService.getPublicKey(toUserId)
    const myPublicKey = await encryptionService.getPublicKey(currentUser.id)

    const encryptedMessage = await encryptionService.encryptMessage(
      messageText,
      recipientPublicKey,
      myPublicKey
    )

    webSocketService.send<string>({
      type: WebSocketMessageType.SEND_DIRECT_MESSAGE,
      recipientId: toUserId,
      payload: encryptedMessage
    })

    return {
      id: null,
      conversationId: null,
      user: currentUser,
      content: encryptedMessage,
      conversationType: 'DIRECT',
      isEdited: false,
      createdAt: new Date().toISOString()
    }
  }

  async sendMessage(
    currentUser: User,
    conversation: Conversation,
    messageText: string
  ): Promise<Message> {
    let content = messageText

    if (isDirectConversation(conversation)) {
      const recipientPublicKey = await encryptionService.getPublicKey(conversation.otherUserId)
      const myPublicKey = await encryptionService.getPublicKey(currentUser.id)
      content = await encryptionService.encryptMessage(messageText, recipientPublicKey, myPublicKey)
    }

    webSocketService.send<string>({
      type: WebSocketMessageType.SEND_MESSAGE,
      recipientId: conversation.id,
      payload: content
    })

    return {
      id: null,
      conversationId: conversation.id,
      user: currentUser,
      content: content,
      conversationType: 'DIRECT',
      isEdited: false,
      createdAt: new Date().toISOString()
    }
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

    return {
      id: null,
      conversationId: channel.conversationId,
      user: currentUser,
      content: messageText,
      conversationType: 'CHANNEL',
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
      const recipientPublicKey = await encryptionService.getPublicKey(toUserId)
      const myPublicKey = await encryptionService.getPublicKey(userState.currentUser.id)
      const encrypted: string = await encryptionService.encryptMessage(
        newContent,
        recipientPublicKey,
        myPublicKey
      )

      webSocketService.send({
        type: WebSocketMessageType.SEND_EDIT_MESSAGE,
        recipientId: message.conversationId,
        payload: {
          messageId: message.id,
          content: encrypted
        }
      })
    } catch (error) {
      errorService.reportError(error)
    }
  }

  async editChannelMessage(message: Message, newContent: string): Promise<void> {
    webSocketService.send({
      type: WebSocketMessageType.SEND_EDIT_MESSAGE,
      recipientId: message.conversationId,
      payload: {
        messageId: message.id,
        content: newContent
      }
    })
  }

  async markConversationAsRead(conversationId: number): Promise<void> {
    if (!conversationId) return

    try {
      await authenticatedPost(null, `api/conversations/${conversationId}/read`)
      notificationService.markConversationAsRead(conversationId)
    } catch (error) {
      console.error('Failed to mark conversationId as read:', error)
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

  private handleIncomingChannelMessage = async (msg: Message): Promise<void> => {
    if (msg.conversationId === chatState.selectedChannel?.conversationId) {
      conversationState.messages = [...conversationState.messages, msg]
    }
  }

  private handleIncomingDirectMessage = async (msg: Message): Promise<void> => {
    const isFromMe = msg.user.id === userState.currentUser?.id
    const otherUser = isFromMe ? chatState.selectedUser : msg.user
    const otherUserId = otherUser?.id

    if (!otherUser || !otherUserId) {
      return
    }

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
}

export const chatService = new ChatService()
