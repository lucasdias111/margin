import { userListState } from '$src/states/UserListState.svelte.js'
import { chatState } from '$src/states/ChatState.svelte.js'
import { spaceState } from '$src/states/SpaceState.svelte.js'

class PresenceService {
  setOnline(userId: number): void {
    const recentEntry = userListState.recentUsers.find((u) => u.user.id === userId)
    if (recentEntry) recentEntry.user.isOnline = true

    if (chatState.selectedUser?.id === userId) chatState.selectedUser.isOnline = true

    const spaceMember = spaceState.selectedSpace?.members.find((m) => m.user.id === userId)
    if (spaceMember) spaceMember.user.isOnline = true
  }

  setOffline(userId: number): void {
    const recentEntry = userListState.recentUsers.find((u) => u.user.id === userId)
    if (recentEntry) recentEntry.user.isOnline = false

    if (chatState.selectedUser?.id === userId) chatState.selectedUser.isOnline = false

    const spaceMember = spaceState.selectedSpace?.members.find((m) => m.user.id === userId)
    if (spaceMember) spaceMember.user.isOnline = false
  }
}

export const presenceService = new PresenceService()
