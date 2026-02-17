import type { User } from '$src/interfaces/User'

class UserState {
  currentUser = $state<User | null>(null)

  setUser(user: User | null) {
    this.currentUser = user
  }

  reset() {
    this.currentUser = null
  }

  updateUser(updates: Partial<User>) {
    if (this.currentUser) {
      this.currentUser = { ...this.currentUser, ...updates }
    }
  }
}

export const userState = new UserState()
