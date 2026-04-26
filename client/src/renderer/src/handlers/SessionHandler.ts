import type { User } from '$src/interfaces/User'
import { sessionState } from '$src/states/SessionState.svelte'
import { authenticatedGet } from '$src/services/api'

class SessionHandler {
  async getCurrentUser(): Promise<void> {
    const response = await authenticatedGet(`users/me`)
    this.setCurrentUser(await response.json())
  }

  setCurrentUser(user: User): void {
    sessionState.currentUser = user
  }
}

export const sessionHandler = new SessionHandler()
