import { usersState } from '$src/states/UsersState.svelte.js'

class PresenceService {
  setOnline(userId: number): void {
    this.setPresence(userId, true)
  }

  setOffline(userId: number): void {
    this.setPresence(userId, false)
  }

  private setPresence(userId: number, isOnline: boolean): void {
    const existing = usersState.byId.get(userId)
    if (!existing) return
    usersState.byId.set(userId, { ...existing, isOnline })
  }
}

export const presenceService = new PresenceService()
