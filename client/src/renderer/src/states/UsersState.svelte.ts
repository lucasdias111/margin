import type { User } from '$src/interfaces/User'
import { SvelteMap } from 'svelte/reactivity'

class UsersState {
  byId = new SvelteMap<number, User>()

  add(user: User): void {
    this.byId.set(user.id, user)
  }

  reset(): void {
    this.byId.clear()
  }
}

export const usersState = new UsersState()
