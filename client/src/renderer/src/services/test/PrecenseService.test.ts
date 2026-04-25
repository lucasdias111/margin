import { beforeEach, describe, expect, it, vi } from 'vitest'
import { presenceService } from '../PrecenseService'
import { usersState } from '$src/states/UsersState.svelte'
import type { User } from '$src/interfaces/User'

vi.mock('$src/states/UsersState.svelte', () => ({
  usersState: {
    byId: new Map<number, User>()
  }
}))

function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    handle: 'lucas',
    displayName: 'Lucas',
    email: 'lucas@margin.chat',
    createdAt: '2025-01-01T00:00:00Z',
    profilePictureUrl: null,
    isOnline: false,
    ...overrides
  }
}

describe('PresenceService', () => {
  beforeEach(() => {
    usersState.byId = new Map()
  })

  describe('setOnline', () => {
    it('sets isOnline to true on matching user in usersState.byId', () => {
      const user = buildUser({ id: 2, isOnline: false })
      usersState.byId.set(2, user)

      presenceService.setOnline(2)

      expect(usersState.byId.get(2)?.isOnline).toBe(true)
    })

    it('does nothing when user is not in byId', () => {
      presenceService.setOnline(999)

      expect(usersState.byId.has(999)).toBe(false)
    })

    it('does not affect unrelated users', () => {
      const target = buildUser({ id: 2, isOnline: false })
      const other = buildUser({ id: 3, isOnline: false })
      usersState.byId.set(2, target)
      usersState.byId.set(3, other)

      presenceService.setOnline(2)

      expect(usersState.byId.get(2)?.isOnline).toBe(true)
      expect(usersState.byId.get(3)?.isOnline).toBe(false)
    })
  })

  describe('setOffline', () => {
    it('sets isOnline to false on matching user in usersState.byId', () => {
      const user = buildUser({ id: 2, isOnline: true })
      usersState.byId.set(2, user)

      presenceService.setOffline(2)

      expect(usersState.byId.get(2)?.isOnline).toBe(false)
    })

    it('does nothing when user is not in byId', () => {
      expect(() => presenceService.setOffline(999)).not.toThrow()
      expect(usersState.byId.has(999)).toBe(false)
    })

    it('does not affect unrelated users', () => {
      const target = buildUser({ id: 2, isOnline: true })
      const other = buildUser({ id: 3, isOnline: true })
      usersState.byId.set(2, target)
      usersState.byId.set(3, other)

      presenceService.setOffline(2)

      expect(usersState.byId.get(2)?.isOnline).toBe(false)
      expect(usersState.byId.get(3)?.isOnline).toBe(true)
    })
  })
})
