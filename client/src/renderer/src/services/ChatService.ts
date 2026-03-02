import type { ConversationMessagesResponse, Message } from '$src/interfaces/Messages'
import type { User } from '$src/interfaces/User'
import {
  isDirectConversation,
  type Conversation,
  type DirectConversation
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
import { presenceState } from '$src/states/PresenceState.svelte'

class ChatService {
  async handleIncomingMessage(data: WebSocketMessage<Message>): Promise<void> {
    const incomingMsg: Message = data.payload

    notificationService.handleIncomingMessage(incomingMsg)

    if (incomingMsg.conversationType === 'CHANNEL') {
      if (incomingMsg.conversationId === chatState.selectedChannel?.conversationId) {
        conversationState.messages = [...conversationState.messages, incomingMsg]
      }
      return
    }

    if (!conversationState.currentConversation) {
      if (chatState.selectedUser) {
        conversationState.currentConversation = {
          id: incomingMsg.conversationId,
          type: 'DIRECT',
          otherUserId: chatState.selectedUser.id,
          createdAt: incomingMsg.createdAt
        } satisfies DirectConversation
      } else {
        return
      }
    }

    if (incomingMsg.conversationId !== conversationState.currentConversation.id) return

    try {
      const isFromMe = incomingMsg.user.id === userState.currentUser?.id
      incomingMsg.content = await encryptionService.decryptMessage(incomingMsg.content, !isFromMe)
    } catch (error) {
      console.error('Failed to decrypt message:', error)
      incomingMsg.content = '[Decryption failed]'
    }

    conversationState.messages = [...conversationState.messages, incomingMsg]
    await chatService.markConversationAsRead(conversationState.currentConversation.id)
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

      if (messageResponse.conversation == null) {
        return
      }

      conversationState.currentConversation = messageResponse.conversation

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

    if (chatState.selectedSpace?.members) {
      presenceState.untrack(chatState.selectedSpace.members.map((m) => m.user.id))
    }

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

      await this.markConversationAsRead(channel.conversationId)

      if (chatState.selectedSpace?.members) {
        await presenceState.fetchAndTrack(chatState.selectedSpace.members.map((m) => m.user.id))
      }
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

  async markConversationAsRead(conversationId: number): Promise<void> {
    if (!conversationId) return

    console.log('Marked as read for conversation id', conversationId)
    try {
      await authenticatedPost(null, `api/conversations/${conversationId}/read`)
      notificationService.markConversationAsRead(conversationId)
    } catch (error) {
      console.error('Failed to mark conversationId as read:', error)
    }
  }
}

export const chatService = new ChatService()
