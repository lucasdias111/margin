import type { User } from '$src/interfaces/User'

export interface RecentChatUsers {
  user: User
  lastMessage?: string
  lastMessageTime?: string
  lastMessageIncoming: boolean
}
