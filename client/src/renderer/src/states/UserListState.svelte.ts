import type { RecentChatUser } from '$src/interfaces/RecentChatUser'
import type { DirectConversation } from '$src/interfaces/Conversation'
import type { User } from '$src/interfaces/User'

export interface PendingInvite {
  conversation: DirectConversation
  fromUser: User
}

class UserListState {
  recentUsers = $state<RecentChatUser[]>([])
  pendingInvites = $state<PendingInvite[]>([])

  private sortByRecent(): void {
    this.recentUsers = [...this.recentUsers].sort((a, b) => {
      if (!a.lastMessageTime) return 1
      if (!b.lastMessageTime) return -1
      return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
    })
  }

  setUsers(users: RecentChatUser[]): void {
    this.recentUsers = [...new Map(users.map((u) => [u.user.id, u])).values()]
    this.sortByRecent()
  }

  addUser(user: RecentChatUser): void {
    this.recentUsers = [...this.recentUsers, user]
    this.sortByRecent()
  }

  addPendingInvite(invite: PendingInvite): void {
    const exists = this.pendingInvites.find((i) => i.conversation.id === invite.conversation.id)
    if (!exists) {
      this.pendingInvites = [...this.pendingInvites, invite]
    }
  }

  removePendingInvite(conversationId: number): void {
    this.pendingInvites = this.pendingInvites.filter((i) => i.conversation.id !== conversationId)
  }

  updateLastMessage(userId: number, message: string, incoming: boolean, time: string): void {
    const entry = this.recentUsers.find((u) => u.user.id === userId)
    if (entry) {
      entry.lastMessage = message
      entry.lastMessageIncoming = incoming
      entry.lastMessageTime = time
      this.sortByRecent()
    }
  }
}

export const userListState = new UserListState()
