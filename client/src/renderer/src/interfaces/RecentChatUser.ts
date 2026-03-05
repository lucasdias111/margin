import type { User } from '$src/interfaces/User'

export interface RecentChatUser {
  user: User
  lastMessage?: string
  lastMessageTime?: string
  lastMessageIncoming: boolean
}
