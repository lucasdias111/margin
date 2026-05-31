import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usersService } from '../UsersService'
import { conversationsState } from '$src/states/ConversationsState.svelte'
import { usersState } from '$src/states/UsersState.svelte'
import { buildDirectConversation, buildRecentChatUser } from '$src/test-utils/mocks'

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
    // Regression: at login, loadUnreadMessages marks DMs unread, then loadRecentUsers
    // ran loadRecentConversations which used to overwrite unread:false. Badge flickered
    // briefly before disappearing.
    it('preserves existing unread:true set by loadUnreadMessages', () => {
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
})
