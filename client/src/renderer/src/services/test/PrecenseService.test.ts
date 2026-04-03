import { beforeEach, describe, expect, it, vi } from 'vitest'
import { presenceService } from '../PrecenseService'
import { userListState } from '$src/states/UserListState.svelte.js'
import { chatState } from '$src/states/ChatState.svelte.js'
import { spaceState } from '$src/states/SpaceState.svelte.js'
import type { User } from '$src/interfaces/User'
import type { RecentChatUser } from '$src/interfaces/RecentChatUser'

vi.mock('$src/states/UserListState.svelte.js', () => ({
  userListState: {
    recentUsers: [] as RecentChatUser[]
  }
}))

vi.mock('$src/states/ChatState.svelte.js', () => ({
  chatState: {
    selectedUser: null as User | null
  }
}))

vi.mock('$src/states/SpaceState.svelte.js', () => ({
  spaceState: {
    selectedSpace: null as { members: { user: User }[] } | null
  }
}))

function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    username: 'lucas',
    displayName: 'Lucas',
    email: 'lucas@margin.chat',
    createdAt: '2025-01-01T00:00:00Z',
    profilePictureUrl: null,
    isOnline: false,
    ...overrides
  }
}

function buildRecentChatUser(user: User): RecentChatUser {
  return {
    conversationId: 1,
    user,
    lastMessage: 'hello',
    lastMessageTime: '2025-06-01T12:00:00Z',
    lastMessageIncoming: true
  }
}

describe('PresenceService', () => {
  beforeEach(() => {
    userListState.recentUsers = []
    chatState.selectedUser = null
    spaceState.selectedSpace = null
  })

  describe('setOnline', () => {
    it('sets isOnline on matching user in recentUsers', () => {
      const user = buildUser({ id: 2, isOnline: false })
      userListState.recentUsers = [buildRecentChatUser(user)]

      presenceService.setOnline(2)

      expect(userListState.recentUsers[0].user.isOnline).toBe(true)
    })

    it('sets isOnline on selectedUser when id matches', () => {
      chatState.selectedUser = buildUser({ id: 2, isOnline: false })

      presenceService.setOnline(2)

      expect(chatState.selectedUser.isOnline).toBe(true)
    })

    it('sets isOnline on matching space member', () => {
      const member = buildUser({ id: 2, isOnline: false })
      spaceState.selectedSpace = {
        members: [
          {
            user: member,
            spaceId: 0,
            role: '',
            joinedAt: ''
          }
        ]
      }

      presenceService.setOnline(2)

      expect(spaceState.selectedSpace.members[0].user.isOnline).toBe(true)
    })

    it('does not modify unrelated users in recentUsers', () => {
      const other = buildUser({ id: 3, isOnline: false })
      userListState.recentUsers = [buildRecentChatUser(other)]

      presenceService.setOnline(2)

      expect(userListState.recentUsers[0].user.isOnline).toBe(false)
    })

    it('does not modify selectedUser when id does not match', () => {
      chatState.selectedUser = buildUser({ id: 3, isOnline: false })

      presenceService.setOnline(2)

      expect(chatState.selectedUser.isOnline).toBe(false)
    })

    it('handles null selectedUser without throwing', () => {
      chatState.selectedUser = null

      expect(() => presenceService.setOnline(2)).not.toThrow()
    })

    it('handles null selectedSpace without throwing', () => {
      spaceState.selectedSpace = null

      expect(() => presenceService.setOnline(2)).not.toThrow()
    })

    it('updates all three locations simultaneously', () => {
      const user1 = buildUser({ id: 2, isOnline: false })
      const user2 = buildUser({ id: 2, isOnline: false })
      const user3 = buildUser({ id: 2, isOnline: false })
      userListState.recentUsers = [buildRecentChatUser(user1)]
      chatState.selectedUser = user2
      spaceState.selectedSpace = {
        members: [
          {
            user: user3,
            spaceId: 0,
            role: '',
            joinedAt: ''
          }
        ]
      }

      presenceService.setOnline(2)

      expect(user1.isOnline).toBe(true)
      expect(user2.isOnline).toBe(true)
      expect(user3.isOnline).toBe(true)
    })
  })

  describe('setOffline', () => {
    it('sets isOnline false on matching user in recentUsers', () => {
      const user = buildUser({ id: 2, isOnline: true })
      userListState.recentUsers = [buildRecentChatUser(user)]

      presenceService.setOffline(2)

      expect(userListState.recentUsers[0].user.isOnline).toBe(false)
    })

    it('sets isOnline false on selectedUser when id matches', () => {
      chatState.selectedUser = buildUser({ id: 2, isOnline: true })

      presenceService.setOffline(2)

      expect(chatState.selectedUser.isOnline).toBe(false)
    })

    it('sets isOnline false on matching space member', () => {
      const member = buildUser({ id: 2, isOnline: true })
      spaceState.selectedSpace = {
        members: [
          {
            user: member,
            spaceId: 0,
            role: '',
            joinedAt: ''
          }
        ]
      }

      presenceService.setOffline(2)

      expect(spaceState.selectedSpace.members[0].user.isOnline).toBe(false)
    })

    it('does not modify unrelated users', () => {
      const other = buildUser({ id: 3, isOnline: true })
      userListState.recentUsers = [buildRecentChatUser(other)]

      presenceService.setOffline(2)

      expect(userListState.recentUsers[0].user.isOnline).toBe(true)
    })

    it('handles all null states without throwing', () => {
      chatState.selectedUser = null
      spaceState.selectedSpace = null
      userListState.recentUsers = []

      expect(() => presenceService.setOffline(2)).not.toThrow()
    })
  })
})
