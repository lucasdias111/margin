import type { User } from '$src/interfaces/User'
import type { Conversation } from '$src/interfaces/Conversation'

export interface RecentChatUser {
  conversation: Conversation
  user: User
  lastMessage?: string
  lastMessageTime?: string
  lastMessageIncoming: boolean
}
