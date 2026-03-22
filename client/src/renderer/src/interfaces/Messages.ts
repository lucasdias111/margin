import type { Conversation } from '$src/interfaces/Conversation'
import type { User } from '$src/interfaces/User'

export interface Message {
  id: number
  conversationId: number
  conversationType: 'DIRECT' | 'GROUP' | 'CHANNEL'
  user: User
  content: string
  isEdited: boolean
  createdAt: string
  marginId?: number
}

export interface ConversationMessagesResponse {
  messages: Message[]
  conversation: Conversation
}
