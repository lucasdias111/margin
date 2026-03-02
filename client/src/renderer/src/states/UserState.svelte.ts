import type { User } from '$src/interfaces/User'

class UserState {
  currentUser = $state<User | null>(null)

  setUser(user: User | null): void {
    this.currentUser = user
  }

  reset(): void {
    this.currentUser = null
  }
}

export const userState = new UserState()
