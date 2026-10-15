import { beforeEach, describe, expect, it, vi } from 'vitest'
import { incomingMessageService } from '$src/services/websocket/handlers/IncomingMessageService'
import { messageSenderService } from '../MessageSenderService'
import { messageLoaderService } from '../MessageLoaderService'
import { groupConversationService } from '../GroupConversationService'
import { encryptionService } from '$src/services/EncryptionService'
import { webSocketService } from '$src/services/websocket/WebSocketService'
import { notificationService } from '$src/services/NotificationService'
import { navigationService } from '$src/services/NavigationService'
import { channelService } from '$src/services/ChannelService'
import { conversationsState, defaultMeta } from '$src/states/ConversationsState.svelte'
import { navigationState } from '$src/states/NavigationState.svelte'
import { sessionState } from '$src/states/SessionState.svelte'
import { connectionState } from '$src/states/ConnectionState.svelte'
import { WebSocketMessageType } from '$src/interfaces/WebSocketMessageType'
import * as api from '$src/services/api'
import { View } from '$src/interfaces/View'
import type { ConversationMessagesResponse } from '$src/interfaces/Messages'
import { buildGroupConversation, buildMessage, buildUser } from '$src/test-utils/mocks'

vi.mock('$src/services/EncryptionService', () => ({
  encryptionService: {
    decryptGroupMessage: vi.fn(),
    encryptMessageForGroup: vi.fn(),
    getPublicKey: vi.fn()
  }
}))

vi.mock('$src/services/websocket/WebSocketService', () => ({
  webSocketService: { send: vi.fn() }
}))

vi.mock('$src/services/NotificationService', () => ({
  notificationService: {
    notifyIncomingMessage: vi.fn(),
    dismissNotificationsForConversation: vi.fn()
  }
}))

vi.mock('$src/services/NavigationService', () => ({
  navigationService: { setView: vi.fn() }
}))

vi.mock('$src/services/ChannelService', () => ({
  channelService: { select: vi.fn() }
}))

vi.mock('$src/services/api', () => ({
  authenticatedGet: vi.fn(),
  authenticatedPost: vi.fn(),
  authenticatedDelete: vi.fn(),
  setUnauthenticatedHandler: vi.fn()
}))

vi.mock('$src/services/FileStorageService', () => ({
  fileStorageService: { uploadConversationFile: vi.fn() }
}))

describe('ChatService group messaging', () => {
  const currentUser = buildUser({ id: 1 })

  beforeEach(() => {
    conversationsState.clear()
    navigationState.view = View.Private
    navigationState.selectedUser = null
    navigationState.selectedChannel = null
    navigationState.selectedGroupConversation = null
    sessionState.currentUser = currentUser
    connectionState.connectionStatus = 'connected'
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock')
    globalThis.URL.revokeObjectURL = vi.fn()
    vi.clearAllMocks()
  })

  describe('handleIncomingMessage — GROUP type', () => {
    it('appends group message to state and notifies when not active', async () => {
      const group = buildGroupConversation({ id: 30 })
      conversationsState.byId.set(30, group)

      const msg = buildMessage({
        id: 201,
        conversationType: 'GROUP',
        conversationId: 30,
        user: buildUser({ id: 2 })
      })

      await incomingMessageService.handleIncomingMessage({
        type: WebSocketMessageType.RECEIVE_MESSAGE,
        timestamp: 0,
        payload: msg
      })

      expect(conversationsState.messagesByConversationId.get(30)).toContainEqual(msg)
      expect(notificationService.notifyIncomingMessage).toHaveBeenCalledWith(msg)
    })

    it('decrypts group message when conversation is encrypted', async () => {
      const group = buildGroupConversation({ id: 30, encrypted: true })
      conversationsState.byId.set(30, group)

      vi.mocked(encryptionService.decryptGroupMessage).mockResolvedValue('decrypted!')

      const msg = buildMessage({
        id: 202,
        conversationType: 'GROUP',
        conversationId: 30,
        content: 'base64-ciphertext',
        user: buildUser({ id: 2 })
      })

      await incomingMessageService.handleIncomingMessage({
        type: WebSocketMessageType.RECEIVE_MESSAGE,
        timestamp: 0,
        payload: msg
      })

      expect(encryptionService.decryptGroupMessage).toHaveBeenCalledWith(
        'base64-ciphertext',
        currentUser.id
      )
      const stored = conversationsState.messagesByConversationId.get(30)!
      expect(stored[0].content).toBe('decrypted!')
    })

    it('shows [Decryption failed] when decryption throws', async () => {
      const group = buildGroupConversation({ id: 30, encrypted: true })
      conversationsState.byId.set(30, group)

      vi.mocked(encryptionService.decryptGroupMessage).mockRejectedValue(new Error('oops'))

      const msg = buildMessage({
        id: 203,
        conversationType: 'GROUP',
        conversationId: 30,
        content: 'bad',
        user: buildUser({ id: 2 })
      })

      await incomingMessageService.handleIncomingMessage({
        type: WebSocketMessageType.RECEIVE_MESSAGE,
        timestamp: 0,
        payload: msg
      })

      const stored = conversationsState.messagesByConversationId.get(30)!
      expect(stored[0].content).toBe('[Decryption failed]')
    })

    it('does not decrypt when conversation is not encrypted', async () => {
      const group = buildGroupConversation({ id: 30, encrypted: false })
      conversationsState.byId.set(30, group)

      const msg = buildMessage({
        conversationType: 'GROUP',
        conversationId: 30,
        content: 'plain',
        user: buildUser({ id: 2 })
      })

      await incomingMessageService.handleIncomingMessage({
        type: WebSocketMessageType.RECEIVE_MESSAGE,
        timestamp: 0,
        payload: msg
      })

      expect(encryptionService.decryptGroupMessage).not.toHaveBeenCalled()
    })
  })

  describe('sendGroupMessage', () => {
    it('sends a plain group message via WebSocket', async () => {
      const group = buildGroupConversation({ id: 30, encrypted: false })

      await messageSenderService.sendGroupMessage(currentUser, group, 'hello group')

      expect(webSocketService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          type: WebSocketMessageType.SEND_MESSAGE,
          recipientId: 30,
          payload: expect.objectContaining({ content: 'hello group' })
        })
      )
    })

    it('encrypts message before sending for secret groups', async () => {
      const group = buildGroupConversation({ id: 30, encrypted: true })

      vi.mocked(api.authenticatedGet).mockResolvedValue({
        ok: true,
        json: async () => ({ 1: 'key1', 2: 'key2' })
      } as Response)

      vi.mocked(encryptionService.encryptMessageForGroup).mockResolvedValue('encrypted-blob')

      await messageSenderService.sendGroupMessage(currentUser, group, 'secret')

      expect(encryptionService.encryptMessageForGroup).toHaveBeenCalledWith('secret', {
        '1': 'key1',
        '2': 'key2'
      })
      expect(webSocketService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({ content: 'encrypted-blob' })
        })
      )
    })
  })

  describe('createGroupConversation', () => {
    it('stores the group in conversationsState after creation', async () => {
      const group = buildGroupConversation({ id: 50, name: 'My Group' })

      vi.mocked(api.authenticatedPost).mockResolvedValue({
        ok: true,
        json: async () => group
      } as Response)

      const result = await groupConversationService.createGroupConversation(
        ['a@example.com'],
        'My Group',
        false
      )

      expect(result.id).toBe(50)
      expect(conversationsState.byId.get(50)).toEqual(group)
    })
  })

  describe('loadConversationForGroup', () => {
    it('loads and decrypts messages for encrypted group', async () => {
      const group = buildGroupConversation({ id: 30, encrypted: true })
      conversationsState.byId.set(30, group)

      const encryptedMsg = buildMessage({
        conversationId: 30,
        conversationType: 'GROUP',
        content: 'cipher'
      })
      const messagesResponse: ConversationMessagesResponse = {
        conversation: group as any,
        messages: [encryptedMsg]
      }

      vi.mocked(api.authenticatedGet).mockResolvedValue({
        ok: true,
        json: async () => messagesResponse
      } as Response)

      vi.mocked(encryptionService.decryptGroupMessage).mockResolvedValue('plaintext')

      vi.mocked(api.authenticatedPost).mockResolvedValue({
        ok: true,
        json: async () => {}
      } as Response)

      await messageLoaderService.loadConversationForGroup(group, true)

      expect(encryptionService.decryptGroupMessage).toHaveBeenCalled()
      const stored = conversationsState.messagesByConversationId.get(30)!
      expect(stored[0].content).toBe('plaintext')
    })
  })
})
