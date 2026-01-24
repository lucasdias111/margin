import type { DirectMessage, ChannelMessage } from '$src/interfaces/Messages'
import type { User } from '$src/interfaces/User'
import { encryptionService } from './EncryptionService'
import { webSocketService } from './WebSocketService'
import { WebSocketMessageType } from '$src/interfaces/WebSocketMessageType'
import type { Channel } from '$src/interfaces/Channel'

class ChatService {
  async getSpaces(): Promise<void> {
    // TODO get spaces from backend
    // const response = await authenticatedGet(`users/me`)
  }

  async sendDirectMessage(
    currentUser: User,
    toUserId: number,
    messageText: string
  ): Promise<DirectMessage> {
    const recipientPublicKey = await encryptionService.getPublicKey(toUserId)
    const myPublicKey = await encryptionService.getPublicKey(currentUser.id)

    const encryptedMessage: string = await encryptionService.encryptMessage(
      messageText,
      recipientPublicKey,
      myPublicKey
    )

    webSocketService.send<string>({
      type: WebSocketMessageType.SEND_DIRECT_MESSAGE,
      recipientId: toUserId,
      payload: encryptedMessage
    })

    if (!currentUser) return null

    return {
      id: null,
      fromUserId: currentUser.id,
      toUserId: toUserId,
      message: encryptedMessage,
      isRead: false,
      isEdited: false,
      createdAt: new Date()
    }
  }

  async sendChannelMessage(
    currentUser: User,
    channel: Channel,
    messageText: string
  ): Promise<ChannelMessage> {
    webSocketService.send<string>({
      type: WebSocketMessageType.SEND_CHANNEL_MESSAGE,
      recipientId: channel.id,
      payload: messageText
    })

    return {
      id: null,
      fromUserId: currentUser.id,
      channelId: channel.id,
      message: messageText,
      isEdited: false,
      createdAt: new Date()
    }
  }
}

export const chatService = new ChatService()
