import type { User } from '$src/interfaces/User'

class SessionState {
  private _currentUser = $state<User | null>(null)

  get currentUser(): User | null {
    return this._currentUser
  }

  set currentUser(value: User | null) {
    this._currentUser = value
  }

  clear(): void {
    this._currentUser = null
  }
}

export const sessionState = new SessionState()
