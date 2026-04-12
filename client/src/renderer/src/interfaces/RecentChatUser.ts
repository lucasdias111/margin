import type { User } from '$src/interfaces/User'

export interface RecentChatUser {
  conversationId: number
  user: User
  lastMessage?: string
  lastMessageTime?: string
  lastMessageIncoming: boolean
}
