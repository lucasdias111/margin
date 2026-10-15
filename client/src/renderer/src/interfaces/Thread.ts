import type { ThreadConversation } from '$src/interfaces/Conversation'
import type { User } from '$src/interfaces/User'

export interface ThreadSummary {
  thread: ThreadConversation
  author: User | null
  bodyExcerpt: string | null
  replyCount: number
  lastReplyAt: string | null
  unread: boolean
}
