import { beforeEach, describe, expect, it, vi } from 'vitest'
import { messageLoaderService } from '../MessageLoaderService'
import { authenticatedGet } from '$src/services/api'
import { conversationsState } from '$src/states/ConversationsState.svelte'
import { threadsState } from '$src/states/ThreadsState.svelte'
import type { UnreadConversations } from '$src/interfaces/UnreadCount'

vi.mock('$src/services/api', () => ({
  authenticatedGet: vi.fn(),
  authenticatedPost: vi.fn()
}))

vi.mock('$src/services/EncryptionService', () => ({
  encryptionService: { decryptMessage: vi.fn(), decryptGroupMessage: vi.fn() }
}))

vi.mock('$src/services/NotificationService', () => ({
  notificationService: { dismissNotificationsForConversation: vi.fn() }
}))

function respondWith(unread: Partial<UnreadConversations>): void {
  vi.mocked(authenticatedGet).mockResolvedValue({
    ok: true,
    json: async () => ({
      directConversationIds: [],
      groupConversationIds: [],
      channelUnreads: [],
      threadConversationIds: [],
      ...unread
    })
  } as Response)
}

describe('MessageLoaderService.loadUnreadConversations', () => {
  beforeEach(() => {
    conversationsState.clear()
    threadsState.clear()
  })

  it('marks direct and group conversations unread', async () => {
    respondWith({ directConversationIds: [10], groupConversationIds: [30] })

    await messageLoaderService.loadUnreadConversations()

    expect(conversationsState.conversationMetaById.get(10)?.unread).toBe(true)
    expect(conversationsState.conversationMetaById.get(30)?.unread).toBe(true)
  })

  it('tolerates a response omitting the optional id lists', async () => {
    vi.mocked(authenticatedGet).mockResolvedValue({
      ok: true,
      json: async () => ({ directConversationIds: [10], channelUnreads: [] })
    } as Response)

    await expect(messageLoaderService.loadUnreadConversations()).resolves.toBeUndefined()
    expect(conversationsState.conversationMetaById.get(10)?.unread).toBe(true)
  })

  // The unread dot has to render before the margin is opened, so a channel the
  // client has not otherwise loaded gets a placeholder conversation.
  it('creates a placeholder conversation for an unloaded channel', async () => {
    respondWith({ channelUnreads: [{ conversationId: 20, marginId: 3 }] })

    await messageLoaderService.loadUnreadConversations()

    const placeholder = conversationsState.byId.get(20)
    expect(placeholder).toMatchObject({ id: 20, type: 'CHANNEL', channelId: -1 })
    expect(conversationsState.conversationMetaById.get(20)?.unread).toBe(true)
    expect(conversationsState.marginIdByConversationId.get(20)).toBe(3)
  })

  it('does not overwrite an already loaded channel conversation', async () => {
    conversationsState.byId.set(20, {
      id: 20,
      type: 'CHANNEL',
      channelId: 5,
      name: 'general',
      createdAt: '2025-06-01T12:00:00Z'
    })
    respondWith({ channelUnreads: [{ conversationId: 20, marginId: 3 }] })

    await messageLoaderService.loadUnreadConversations()

    expect(conversationsState.byId.get(20)).toMatchObject({ channelId: 5, name: 'general' })
  })

  it('marks a thread unread once its inbox entry is known', async () => {
    threadsState.setInbox([
      { thread: { id: 40 }, unread: false } as unknown as Parameters<
        typeof threadsState.setInbox
      >[0][number]
    ])
    respondWith({ threadConversationIds: [40] })

    await messageLoaderService.loadUnreadConversations()

    expect(threadsState.isUnread(40)).toBe(true)
  })

  // ThreadsState.markUnread only records ids the inbox already knows, and
  // ThreadService.loadInbox clears/repopulates unread from the server. This is
  // why BootstrapService runs the thread inbox *after* this call — see
  // BootstrapService.test.ts.
  it('does not record an unread thread the inbox has never seen', async () => {
    respondWith({ threadConversationIds: [40] })

    await messageLoaderService.loadUnreadConversations()

    expect(threadsState.isUnread(40)).toBe(false)
  })
})
