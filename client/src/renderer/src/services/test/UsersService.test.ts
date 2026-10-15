import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usersService } from '../UsersService'
import { conversationsState } from '$src/states/ConversationsState.svelte'
import { sessionState } from '$src/states/SessionState.svelte'
import { usersState } from '$src/states/UsersState.svelte'
import { encryptionService } from '$src/services/EncryptionService'
import { authenticatedGet } from '$src/services/api'
import type { RecentChatUser } from '$src/interfaces/RecentChatUser'
import {
  buildDirectConversation,
  buildGroupConversation,
  buildRecentChatUser,
  buildUser
} from '$src/test-utils/mocks'

vi.mock('$src/services/api', () => ({
  authenticatedGet: vi.fn(),
  authenticatedPost: vi.fn(),
  authenticatedPatch: vi.fn(),
  authenticatedPatchForm: vi.fn(),
  authenticatedDelete: vi.fn()
}))

vi.mock('$src/services/EncryptionService', () => ({
  encryptionService: {
    decryptMessage: vi.fn(),
    decryptGroupMessage: vi.fn(),
    encryptMessage: vi.fn(),
    encryptPrivateKey: vi.fn(),
    decryptPrivateKey: vi.fn(),
    getPublicKey: vi.fn()
  }
}))

vi.mock('$src/services/AuthenticationService', () => ({
  authenticationService: { clear: vi.fn() }
}))

describe('UsersService', () => {
  beforeEach(() => {
    conversationsState.clear()
    usersState.reset()
  })

  describe('loadRecentConversations', () => {
    // Regression: at login, loadUnreadConversations marks DMs unread, then
    // loadRecentChatUsers runs loadRecentConversations, which used to overwrite
    // unread:false. Badge flickered briefly before disappearing.
    it('preserves existing unread:true set by loadUnreadConversations', () => {
      conversationsState.markUnread(10)

      usersService.loadRecentConversations([buildRecentChatUser()])

      expect(conversationsState.conversationMetaById.get(10)?.unread).toBe(true)
    })

    it('preserves existing lastReadAt', () => {
      conversationsState.markUnread(10)
      conversationsState.markRead(10, '2025-06-01T00:00:00Z')

      usersService.loadRecentConversations([buildRecentChatUser()])

      expect(conversationsState.conversationMetaById.get(10)?.lastReadAt).toBe(
        '2025-06-01T00:00:00Z'
      )
    })

    it('defaults to unread:false when no prior meta exists', () => {
      usersService.loadRecentConversations([buildRecentChatUser()])

      expect(conversationsState.conversationMetaById.get(10)?.unread).toBe(false)
    })

    it('still hydrates byId and lastMessage fields', () => {
      const conv = buildDirectConversation({ id: 10 })
      usersService.loadRecentConversations([
        buildRecentChatUser({ conversation: conv, lastMessage: 'hi there' })
      ])

      expect(conversationsState.byId.get(10)).toEqual(conv)
      expect(conversationsState.conversationMetaById.get(10)?.lastMessage).toBe('hi there')
    })
  })

  describe('loadRecentChatUsers', () => {
    function respondWith(users: RecentChatUser[]): void {
      vi.mocked(authenticatedGet).mockResolvedValue({
        ok: true,
        json: async () => users
      } as Response)
    }

    beforeEach(() => {
      sessionState.currentUser = buildUser({ id: 1 })
    })

    it('decrypts a 1:1 preview with the direct-message key', async () => {
      vi.mocked(encryptionService.decryptMessage).mockResolvedValue('plaintext')
      respondWith([
        buildRecentChatUser({
          conversation: buildDirectConversation({ id: 10, encrypted: true }),
          lastMessage: 'cipher',
          lastMessageIncoming: true
        })
      ])

      await usersService.loadRecentChatUsers()

      expect(encryptionService.decryptMessage).toHaveBeenCalledWith('cipher', true)
      expect(conversationsState.conversationMetaById.get(10)?.lastMessage).toBe('plaintext')
    })

    it('decrypts a group preview with the current user id', async () => {
      vi.mocked(encryptionService.decryptGroupMessage).mockResolvedValue('group plaintext')
      respondWith([
        buildRecentChatUser({
          conversation: buildGroupConversation({ id: 30, encrypted: true }),
          lastMessage: 'cipher'
        })
      ])

      await usersService.loadRecentChatUsers()

      expect(encryptionService.decryptGroupMessage).toHaveBeenCalledWith('cipher', 1)
      expect(conversationsState.conversationMetaById.get(30)?.lastMessage).toBe('group plaintext')
    })

    it('leaves an unencrypted preview untouched', async () => {
      respondWith([
        buildRecentChatUser({
          conversation: buildDirectConversation({ id: 10, encrypted: false }),
          lastMessage: 'hello'
        })
      ])

      await usersService.loadRecentChatUsers()

      expect(encryptionService.decryptMessage).not.toHaveBeenCalled()
      expect(conversationsState.conversationMetaById.get(10)?.lastMessage).toBe('hello')
    })

    it('falls back to a placeholder when decryption throws', async () => {
      vi.mocked(encryptionService.decryptMessage).mockRejectedValue(new Error('bad key'))
      respondWith([
        buildRecentChatUser({
          conversation: buildDirectConversation({ id: 10, encrypted: true }),
          lastMessage: 'cipher'
        })
      ])

      await usersService.loadRecentChatUsers()

      expect(conversationsState.conversationMetaById.get(10)?.lastMessage).toBe(
        '[Unable to decrypt]'
      )
    })
  })
})
