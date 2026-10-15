import { usersState } from '$src/states/UsersState.svelte.js'

class PresenceService {
  setOnline(userId: number): void {
    const existing = usersState.byId.get(userId)
    if (!existing) return
    usersState.add({ ...existing, isOnline: true })
  }

  setOffline(userId: number): void {
    const existing = usersState.byId.get(userId)
    if (!existing) return
    usersState.add({ ...existing, isOnline: false, lastSeenAt: new Date().toISOString() })
  }
}

export const presenceService = new PresenceService()
