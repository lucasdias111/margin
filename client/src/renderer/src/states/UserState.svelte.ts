import type { User } from '$src/interfaces/User'

class UserState {
  currentUser = $state<User | null>(null)
  setupDone = $state(false)

  setUser(user: User | null): void {
    this.currentUser = user
  }

  reset(): void {
    this.currentUser = null
    this.setupDone = false
  }
}

export const userState = new UserState()
