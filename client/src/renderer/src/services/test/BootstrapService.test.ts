import { beforeEach, describe, expect, it, vi } from 'vitest'
import { bootstrapService } from '../BootstrapService'
import { messageLoaderService } from '$src/services/MessageLoaderService'
import { usersService } from '$src/services/UsersService'
import { threadService } from '$src/services/ThreadService'
import { inviteService } from '$src/services/ConversationInviteService'
import { notificationService } from '$src/services/NotificationService'
import { marginService } from '$src/services/MarginService'
import { sessionHandler } from '$src/handlers/SessionHandler'
import { navigationState } from '$src/states/NavigationState.svelte'
import { View } from '$src/interfaces/View'
import { buildChannel, buildUser } from '$src/test-utils/mocks'

vi.mock('$src/handlers/SessionHandler', () => ({
  sessionHandler: { getCurrentUser: vi.fn() }
}))

vi.mock('$src/services/MessageLoaderService', () => ({
  messageLoaderService: {
    loadUnreadConversations: vi.fn(),
    loadConversationForUser: vi.fn(),
    loadConversationForChannel: vi.fn()
  }
}))

vi.mock('$src/services/UsersService', () => ({
  usersService: { loadRecentChatUsers: vi.fn() }
}))

vi.mock('$src/services/ThreadService', () => ({
  threadService: { loadInbox: vi.fn() }
}))

vi.mock('$src/services/ConversationInviteService', () => ({
  inviteService: { loadPendingInvites: vi.fn(), loadSentInvites: vi.fn() }
}))

vi.mock('$src/services/NotificationService', () => ({
  notificationService: { loadAll: vi.fn() }
}))

vi.mock('$src/services/MarginService', () => ({
  marginService: { loadMarginsForUser: vi.fn() }
}))

function trackCallOrder(): string[] {
  const order: string[] = []
  const record = (name: string) => () => {
    order.push(name)
    return Promise.resolve()
  }

  vi.mocked(sessionHandler.getCurrentUser).mockImplementation(record('currentUser'))
  vi.mocked(messageLoaderService.loadUnreadConversations).mockImplementation(record('unread'))
  vi.mocked(usersService.loadRecentChatUsers).mockImplementation(record('recent'))
  vi.mocked(inviteService.loadPendingInvites).mockImplementation(record('pendingInvites'))
  vi.mocked(inviteService.loadSentInvites).mockImplementation(record('sentInvites'))
  vi.mocked(notificationService.loadAll).mockImplementation(record('notifications'))
  vi.mocked(marginService.loadMarginsForUser).mockImplementation(record('margins'))
  vi.mocked(threadService.loadInbox).mockImplementation(record('threadInbox'))

  return order
}

function resetCooldown(): void {
  ;(bootstrapService as unknown as { lastResyncAt: number }).lastResyncAt = 0
}

describe('BootstrapService', () => {
  beforeEach(() => {
    resetCooldown()
    navigationState.view = View.Private
    navigationState.selectedUser = null
    navigationState.selectedChannel = null
  })

  describe('loadInitialData', () => {
    it('resolves the current user before anything that decrypts with it', async () => {
      const order = trackCallOrder()

      await bootstrapService.loadInitialData()

      expect(order[0]).toBe('currentUser')
    })

    it('loads unread before recent chats, and the thread inbox after both', async () => {
      const order = trackCallOrder()

      await bootstrapService.loadInitialData()

      expect(order.indexOf('unread')).toBeLessThan(order.indexOf('recent'))
      expect(order.indexOf('unread')).toBeLessThan(order.indexOf('threadInbox'))
      expect(order.indexOf('recent')).toBeLessThan(order.indexOf('threadInbox'))
    })

    it('loads every startup resource', async () => {
      const order = trackCallOrder()

      await bootstrapService.loadInitialData()

      expect(order).toEqual([
        'currentUser',
        'unread',
        'recent',
        'pendingInvites',
        'sentInvites',
        'notifications',
        'margins',
        'threadInbox'
      ])
    })
  })

  describe('resync', () => {
    it('re-reads unread, recent chats and the thread inbox in order', async () => {
      const order = trackCallOrder()

      await bootstrapService.resync()

      expect(order).toEqual(['unread', 'recent', 'threadInbox'])
    })

    it('skips a second resync inside the cooldown window', async () => {
      trackCallOrder()

      await bootstrapService.resync()
      await bootstrapService.resync()

      expect(messageLoaderService.loadUnreadConversations).toHaveBeenCalledTimes(1)
    })

    it('resyncs again once the cooldown has elapsed', async () => {
      trackCallOrder()
      vi.useFakeTimers()

      try {
        await bootstrapService.resync()
        vi.setSystemTime(Date.now() + 2001)
        await bootstrapService.resync()
      } finally {
        vi.useRealTimers()
      }

      expect(messageLoaderService.loadUnreadConversations).toHaveBeenCalledTimes(2)
    })

    it('force-reloads the open direct conversation', async () => {
      trackCallOrder()
      const user = buildUser({ id: 7 })
      navigationState.view = View.Private
      navigationState.selectedUser = user

      await bootstrapService.resync()

      expect(messageLoaderService.loadConversationForUser).toHaveBeenCalledWith(user, true)
    })

    it('force-reloads the open channel', async () => {
      trackCallOrder()
      const channel = buildChannel()
      navigationState.view = View.Margin
      navigationState.selectedChannel = channel

      await bootstrapService.resync()

      expect(messageLoaderService.loadConversationForChannel).toHaveBeenCalledWith(channel, true)
    })

    it('reloads nothing when no conversation is open', async () => {
      trackCallOrder()

      await bootstrapService.resync()

      expect(messageLoaderService.loadConversationForUser).not.toHaveBeenCalled()
      expect(messageLoaderService.loadConversationForChannel).not.toHaveBeenCalled()
    })
  })
})
