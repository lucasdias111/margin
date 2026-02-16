import type { Message } from '$src/interfaces/Messages'
import type { User } from '$src/interfaces/User'
import { isDirectConversation, type Conversation } from '$src/interfaces/Conversation'
import { encryptionService } from './EncryptionService'
import { webSocketService } from './WebSocketService'
import { WebSocketMessageType } from '$src/interfaces/WebSocketMessageType'
import type { Channel } from '$src/interfaces/Channel'
import { authenticatedPost } from '$src/services/api'
import { notificationService } from '$src/services/NotificationService'

class ChatService {
  async getSpaces(): Promise<void> {
    // TODO get spaces from backend
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
      fromUserId: currentUser.id,
      fromUsername: currentUser.username,
      content: encryptedMessage,
      conversationType: "DIRECT",
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
      fromUserId: currentUser.id,
      fromUsername: currentUser.username,
      content: content,
      conversationType: "DIRECT",
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
      recipientId: channel.id,
      payload: messageText
    })

    return {
      id: null,
      conversationId: null,
      fromUserId: currentUser.id,
      fromUsername: currentUser.username,
      content: messageText,
      conversationType: "CHANNEL",
      isEdited: false,
      createdAt: new Date().toISOString()
    }
  }

  async markConversationAsRead(conversationId: number): Promise<void> {
    if (!conversationId) return

    console.log("Marked as read for conversation id", conversationId)
    try {
      await authenticatedPost(null, `api/conversations/${conversationId}/read`)
      notificationService.markConversationAsRead(conversationId)
    } catch (error) {
      console.error('Failed to mark conversationId as read:', error)
    }
  }
}

export const chatService = new ChatService()
