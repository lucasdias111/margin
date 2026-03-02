import { SvelteSet } from 'svelte/reactivity'
import { authenticatedGet } from '$src/services/api'

class PresenceState {
  onlineUserIds = new SvelteSet<number>()

  async fetchAndTrack(userIds: number[]): Promise<void> {
    const response = await authenticatedGet(`api/users/online-status?ids=${userIds.join(',')}`)

    if (!response.ok) return

    const statuses: { userId: number; isOnline: boolean }[] = await response.json()

    statuses.forEach(({ userId, isOnline }) => {
      if (isOnline) {
        this.onlineUserIds.add(userId)
      }
    })
  }

  setOnline(userId: number): void {
    this.onlineUserIds.add(userId)
  }

  setOffline(userId: number): void {
    this.onlineUserIds.delete(userId)
  }

  isOnline(userId: number): boolean {
    return this.onlineUserIds.has(userId)
  }

  untrack(userIds: number[]): void {
    userIds.forEach((id) => this.onlineUserIds.delete(id))
  }
}

export const presenceState = new PresenceState()
