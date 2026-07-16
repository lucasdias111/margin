import { beforeEach, describe, expect, it, vi } from 'vitest'
import { messageRouter } from '../MessageRouter'
import { reactionService } from '../ReactionService'
import { notificationService } from '$src/services/NotificationService'
import { conversationsState } from '$src/states/ConversationsState.svelte'
import { navigationState } from '$src/states/NavigationState.svelte'
import { sessionState } from '$src/states/SessionState.svelte'
import { connectionState } from '$src/states/ConnectionState.svelte'
import { threadsState } from '$src/states/ThreadsState.svelte'
import { WebSocketMessageType } from '$src/interfaces/WebSocketMessageType'
import * as api from '$src/services/api'
import { View } from '$src/interfaces/View'
import type { ThreadSummary } from '$src/interfaces/Thread'
import { buildMessage, buildReaction, buildThreadConversation, buildUser } from '$src/test-utils/mocks'

vi.mock('$src/services/EncryptionService', () => ({
  encryptionService: {
    decryptMessage: vi.fn(),
    decryptGroupMessage: vi.fn(),
    getPublicKey: vi.fn()
  }
}))

vi.mock('$src/services/WebSocketService', () => ({
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
  channelService: { select: vi.fn(), getChannelById: vi.fn() }
}))

vi.mock('$src/services/api', () => ({
  authenticatedGet: vi.fn(),
  authenticatedPost: vi.fn(),
  authenticatedDelete: vi.fn(),
  setUnauthenticatedHandler: vi.fn()
}))

vi.mock('$src/services/FileStorageService', () => ({
  fileStorageService: { uploadConversationFile: vi.fn(), uploadChannelFile: vi.fn() }
}))

function buildPostSummary(overrides: Partial<ThreadSummary> = {}): ThreadSummary {
  return {
    thread: buildThreadConversation({ following: true }),
    author: buildUser({ id: 2 }),
    bodyExcerpt: 'the body',
    replyCount: 0,
    lastReplyAt: null,
    unread: false,
    ...overrides
  }
}

function buildThreadReply(overrides = {}): ReturnType<typeof buildMessage> {
  return buildMessage({
    id: 300,
    conversationType: 'THREAD',
    conversationId: 40,
    parentConversationId: 20,
    user: buildUser({ id: 2 }),
    ...overrides
  })
}

describe('MessageRouter — THREAD messages (posts)', () => {
  const currentUser = buildUser({ id: 1 })

  beforeEach(() => {
    conversationsState.clear()
    threadsState.clear()
    navigationState.view = View.Margin
    navigationState.selectedUser = null
    navigationState.selectedChannel = null
    navigationState.selectedGroupConversation = null
    navigationState.selectedThread = null
    sessionState.currentUser = currentUser
    connectionState.connectionStatus = 'connected'
    vi.clearAllMocks()
    vi.mocked(api.authenticatedPost).mockResolvedValue({
      ok: true,
      json: async () => ({})
    } as Response)
    vi.mocked(api.authenticatedGet).mockResolvedValue({
      ok: true,
      json: async () => []
    } as unknown as Response)
  })

  it('bumps reply counts on known posts', async () => {
    conversationsState.byId.set(40, buildThreadConversation({ id: 40 }))
    threadsState.setInbox([buildPostSummary()])

    await messageRouter.handleIncomingMessage({
      type: WebSocketMessageType.RECEIVE_MESSAGE,
      timestamp: 0,
      payload: buildThreadReply({ createdAt: '2025-06-02T10:00:00Z' })
    })

    expect(threadsState.inbox[0].replyCount).toBe(1)
    expect(threadsState.inbox[0].lastReplyAt).toBe('2025-06-02T10:00:00Z')
  })

  it('refreshes the open thread channel when an unknown post gets a message', async () => {
    navigationState.selectedChannel = {
      id: 5,
      conversationId: 20,
      name: 'forum',
      description: '',
      spaceId: 1,
      channelType: 'Thread'
    }

    await messageRouter.handleIncomingMessage({
      type: WebSocketMessageType.RECEIVE_MESSAGE,
      timestamp: 0,
      payload: buildThreadReply()
    })

    expect(api.authenticatedGet).toHaveBeenCalledWith('channels/5/threads')
  })

  it('appends to the post when its messages are loaded', async () => {
    conversationsState.byId.set(40, buildThreadConversation({ id: 40 }))
    conversationsState.messagesByConversationId.set(40, [])

    const msg = buildThreadReply()
    await messageRouter.handleIncomingMessage({
      type: WebSocketMessageType.RECEIVE_MESSAGE,
      timestamp: 0,
      payload: msg
    })

    expect(conversationsState.messagesByConversationId.get(40)).toContainEqual(msg)
  })

  it('notifies and marks unread only for followed posts', async () => {
    conversationsState.byId.set(40, buildThreadConversation({ id: 40 }))
    threadsState.setInbox([buildPostSummary()])

    const msg = buildThreadReply()
    await messageRouter.handleIncomingMessage({
      type: WebSocketMessageType.RECEIVE_MESSAGE,
      timestamp: 0,
      payload: msg
    })

    expect(threadsState.isUnread(40)).toBe(true)
    expect(notificationService.notifyIncomingMessage).toHaveBeenCalledWith(msg)
  })

  it('does not notify for posts the user does not follow', async () => {
    conversationsState.byId.set(40, buildThreadConversation({ id: 40 }))

    await messageRouter.handleIncomingMessage({
      type: WebSocketMessageType.RECEIVE_MESSAGE,
      timestamp: 0,
      payload: buildThreadReply()
    })

    expect(threadsState.isUnread(40)).toBe(false)
    expect(notificationService.notifyIncomingMessage).not.toHaveBeenCalled()
  })

  it('applies live reactions to post messages while the channel is the focused conversation', () => {
    navigationState.selectedChannel = {
      id: 5,
      conversationId: 20,
      name: 'forum',
      description: '',
      spaceId: 1,
      channelType: 'Thread'
    }
    const postMessage = buildMessage({
      id: 300,
      conversationId: 40,
      conversationType: 'THREAD',
      reactions: []
    })
    conversationsState.messagesByConversationId.set(40, [postMessage])

    reactionService.handleIncomingReactionAdded(
      buildReaction({ messageId: 300, conversationId: 40, userId: 2, emoji: '❤️' })
    )

    const stored = conversationsState.messagesByConversationId.get(40)![0]
    expect(stored.reactions).toHaveLength(1)
    expect(stored.reactions[0].emoji).toBe('❤️')
  })

  it('marks the post read instead of unread when it is open and focused', async () => {
    const thread = buildThreadConversation({ id: 40, following: true })
    conversationsState.byId.set(40, thread)
    navigationState.selectedThread = thread
    threadsState.setInbox([buildPostSummary({ thread })])
    vi.spyOn(document, 'hasFocus').mockReturnValue(true)

    await messageRouter.handleIncomingMessage({
      type: WebSocketMessageType.RECEIVE_MESSAGE,
      timestamp: 0,
      payload: buildThreadReply()
    })

    expect(threadsState.isUnread(40)).toBe(false)
    expect(notificationService.notifyIncomingMessage).not.toHaveBeenCalled()
  })
})
