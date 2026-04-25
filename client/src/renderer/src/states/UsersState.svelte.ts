import type { User } from '$src/interfaces/User'

class UsersState {
  byId = $state<Map<number, User>>(new Map())

  add(user: User): void {
    this.byId.set(user.id, user)
    this.byId = new Map(this.byId)
  }

  reset(): void {
    this.byId = new Map()
  }
}

export const usersState = new UsersState()
