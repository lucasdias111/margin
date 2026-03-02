import type { RecentChatUsers } from '$src/interfaces/RecentChatUsers'

class UserListState {
  recentUsers = $state<RecentChatUsers[]>([])

  setUsers(users: RecentChatUsers[]): void {
    this.recentUsers = users
  }
}

export const userListState = new UserListState()
