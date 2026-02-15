import type { Conversation } from '$src/interfaces/Conversation'

export interface Message {
  id: number
  conversationId: number
  conversationType: 'DIRECT' | 'GROUP' | 'CHANNEL'
  fromUserId: number
  content: string
  isEdited: boolean
  createdAt: string
}

export interface ConversationMessagesResponse {
  messages: Message[]
  conversation: Conversation
}
