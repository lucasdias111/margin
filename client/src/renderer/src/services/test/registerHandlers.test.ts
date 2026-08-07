import { beforeEach, describe, expect, it, vi } from 'vitest'
import { WebSocketMessageType } from '$src/interfaces/WebSocketMessageType'
import type { WebSocketMessage } from '$src/interfaces/WebSocketMessages'
import type { Message } from '$src/interfaces/Messages'
import {
  inboundHandlers,
  OUTBOUND_ONLY,
  registerWebSocketHandlers
} from '$src/services/websocket/registerHandlers'
import { webSocketService } from '$src/services/websocket/WebSocketService'
import { conversationsState } from '$src/states/ConversationsState.svelte'
import { sessionState } from '$src/states/SessionState.svelte'
import { buildDirectConversation, buildMessage, buildUser } from '$src/test-utils/mocks'

vi.mock('$src/shared/config', () => ({
  API_CONFIG: { wsUrl: 'ws://localhost:8080/ws', baseUrl: 'http://localhost:8080/api/' }
}))

vi.mock('$src/services/ErrorService', () => ({
  errorService: { reportError: vi.fn() }
}))

vi.mock('$src/services/AuthenticationService', () => ({
  authenticationService: {
    tryRestoreSession: vi.fn(),
    clear: vi.fn()
  }
}))

vi.mock('$src/services/EncryptionService', () => ({
  encryptionService: {
    decryptMessage: vi.fn(async (content: string) => `decrypted:${content}`),
    decryptGroupMessage: vi.fn()
  }
}))

vi.mock('$src/services/api', () => ({
  authenticatedGet: vi.fn(),
  authenticatedPost: vi.fn(),
  authenticatedPatch: vi.fn(),
  authenticatedDelete: vi.fn(),
  setUnauthenticatedHandler: vi.fn()
}))

vi.mock('$src/services/NotificationService', () => ({
  notificationService: {
    notifyIncomingMessage: vi.fn(),
    dismissNotificationsForConversation: vi.fn()
  }
}))

vi.mock('$src/services/NavigationService', () => ({
  navigationService: { setView: vi.fn(), reset: vi.fn() }
}))

vi.mock('$src/services/ChannelService', () => ({
  channelService: { select: vi.fn(), updateVoiceParticipant: vi.fn() }
}))

vi.mock('$src/services/SpaceService', () => ({
  spaceService: { addMemberToSpace: vi.fn() }
}))

vi.mock('$src/services/PrecenseService', () => ({
  presenceService: { setOnline: vi.fn(), setOffline: vi.fn() }
}))

vi.mock('$src/services/TypingIndicatorService', () => ({
  typingIndicatorService: { handleIncoming: vi.fn() }
}))

vi.mock('$src/services/ConversationInviteService', () => ({
  inviteService: {
    handleIncomingConversationInvite: vi.fn(),
    handleConversationInviteAccepted: vi.fn(),
    handleConversationInviteDeclined: vi.fn()
  }
}))

vi.mock('$src/services/MessageLoaderService', () => ({
  messageLoaderService: {
    setConversationReadAt: vi.fn(),
    markConversationAsRead: vi.fn()
  }
}))

vi.mock('$src/services/MessageSenderService', () => ({
  messageSenderService: { replaceOptimisticIfPresent: vi.fn().mockReturnValue(false) }
}))

vi.mock('$src/services/ThreadService', () => ({
  threadService: { loadPostsForChannel: vi.fn(), markThreadAsRead: vi.fn() }
}))

vi.mock('$src/services/call/CallService', () => ({
  callService: {
    handleCallResponse: vi.fn(),
    handleCallCandidate: vi.fn(),
    handleMediaState: vi.fn(),
    endCall: vi.fn()
  }
}))

vi.mock('$src/services/FileStorageService', () => ({
  fileStorageService: { uploadChannelFile: vi.fn(), uploadConversationFile: vi.fn() }
}))

const outboundOnly = OUTBOUND_ONLY as readonly WebSocketMessageType[]

function inboundTypes(): WebSocketMessageType[] {
  return Object.values(WebSocketMessageType).filter((type) => !outboundOnly.includes(type))
}

function registeredHandlers(type: string): unknown[] {
  const service = webSocketService as unknown as { handlers: Map<string, unknown[]> }
  return service.handlers.get(type) ?? []
}

describe('websocket handler registry', () => {
  beforeEach(() => {
    const service = webSocketService as unknown as { handlers: Map<string, unknown[]> }
    service.handlers.clear()
    conversationsState.clear()
  })

  it('has a handler for every inbound message type', () => {
    const missing = inboundTypes().filter((type) => typeof inboundHandlers[type] !== 'function')

    expect(missing).toEqual([])
  })

  it('does not register handlers for outbound-only types', () => {
    const unexpected = OUTBOUND_ONLY.filter((type) => type in inboundHandlers)

    expect(unexpected).toEqual([])
  })

  it('subscribes every inbound type on the socket', () => {
    registerWebSocketHandlers()

    for (const type of inboundTypes()) {
      expect(registeredHandlers(type)).toHaveLength(1)
    }
  })

  it('unsubscribes every inbound type via the returned teardown', () => {
    const unregister = registerWebSocketHandlers()

    unregister()

    for (const type of inboundTypes()) {
      expect(registeredHandlers(type)).toHaveLength(0)
    }
  })

  it('registers idempotently so a re-register cannot double-dispatch', () => {
    registerWebSocketHandlers()
    registerWebSocketHandlers()

    expect(registeredHandlers(WebSocketMessageType.RECEIVE_MESSAGE)).toHaveLength(1)
  })

  describe('message mutations are handled without a chat component mounted', () => {
    const conversationId = 10
    const currentUser = buildUser({ id: 1 })
    const otherUser = buildUser({ id: 2, displayName: 'Other' })

    beforeEach(() => {
      sessionState.currentUser = currentUser
      conversationsState.byId.set(
        conversationId,
        buildDirectConversation({ id: conversationId, encrypted: true, otherUserId: otherUser.id })
      )
      registerWebSocketHandlers()
    })

    function dispatch(type: WebSocketMessageType, payload: unknown): void {
      const handler = registeredHandlers(type)[0] as (data: WebSocketMessage<unknown>) => void
      handler({ type, timestamp: Date.now(), payload })
    }

    it('applies an incoming edit to the cached message', async () => {
      const message = buildMessage({ id: 100, conversationId, user: otherUser })
      conversationsState.messagesByConversationId.set(conversationId, [message])

      dispatch(WebSocketMessageType.RECEIVE_EDIT_MESSAGE, {
        ...message,
        content: 'new-cipher'
      } satisfies Message)
      await vi.waitFor(() => {
        const updated = conversationsState.messagesByConversationId.get(conversationId)![0]
        expect(updated.isEdited).toBe(true)
      })

      const updated = conversationsState.messagesByConversationId.get(conversationId)![0]
      expect(updated.content).toBe('decrypted:new-cipher')
    })

    it('applies an incoming delete to the cached message', () => {
      const message = buildMessage({ id: 100, conversationId, user: otherUser })
      conversationsState.messagesByConversationId.set(conversationId, [message])

      expect(conversationsState.messagesByConversationId.get(conversationId)).toHaveLength(1)

      dispatch(WebSocketMessageType.RECEIVE_DELETE_MESSAGE, message)

      expect(conversationsState.messagesByConversationId.get(conversationId)).toHaveLength(0)
    })

    it('applies an incoming reaction to the cached message', () => {
      const message = buildMessage({ id: 100, conversationId, user: otherUser })
      conversationsState.messagesByConversationId.set(conversationId, [message])

      dispatch(WebSocketMessageType.RECEIVE_ADD_REACTION, {
        id: 1,
        messageId: 100,
        conversationId,
        userId: otherUser.id,
        displayName: otherUser.displayName,
        emoji: '👍'
      })

      const updated = conversationsState.messagesByConversationId.get(conversationId)![0]
      expect(updated.reactions).toHaveLength(1)
      expect(updated.reactions[0].emoji).toBe('👍')
    })

    it('removes an incoming reaction from the cached message', () => {
      const reaction = {
        id: 1,
        messageId: 100,
        conversationId,
        userId: otherUser.id,
        displayName: otherUser.displayName,
        emoji: '👍'
      }
      const message = buildMessage({
        id: 100,
        conversationId,
        user: otherUser,
        reactions: [reaction]
      })
      conversationsState.messagesByConversationId.set(conversationId, [message])

      dispatch(WebSocketMessageType.RECEIVE_REMOVE_REACTION, reaction)

      const updated = conversationsState.messagesByConversationId.get(conversationId)![0]
      expect(updated.reactions).toHaveLength(0)
    })
  })
})
