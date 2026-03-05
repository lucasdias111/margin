import type { RecentChatUser } from '$src/interfaces/RecentChatUser'

class UserListState {
  recentUsers = $state<RecentChatUser[]>([])

  private sortByRecent(): void {
    this.recentUsers = [...this.recentUsers].sort((a, b) => {
      if (!a.lastMessageTime) return 1
      if (!b.lastMessageTime) return -1
      return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
    })
  }

  setUsers(users: RecentChatUser[]): void {
    this.recentUsers = users
    this.sortByRecent()
  }

  addUser(user: RecentChatUser): void {
    this.recentUsers = [...this.recentUsers, user]
    this.sortByRecent()
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
