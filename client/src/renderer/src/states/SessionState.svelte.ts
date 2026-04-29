import type { User } from '$src/interfaces/User'

class SessionState {
  private _currentUser: User = $state<User | null>(null)

  get currentUser(): User {
    return this._currentUser
  }

  set currentUser(value: User) {
    this._currentUser = value
  }
}

export const sessionState = new SessionState()
