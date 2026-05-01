import type { Conversation } from '$src/interfaces/Conversation'
import type { User } from '$src/interfaces/User'

export interface MessageReaction {
  id: number
  messageId: number
  conversationId: number
  userId: number
  displayName: string
  emoji: string
}

export interface Message {
  id: number
  conversationId: number
  conversationType: 'DIRECT' | 'GROUP' | 'CHANNEL'
  user: User
  content: string
  isEdited: boolean
  createdAt: string
  marginId?: number
  channelName?: string
  reactions: MessageReaction[]
  imageAddress?: string | null
}

export interface ConversationMessagesResponse {
  messages: Message[]
  conversation: Conversation
}
