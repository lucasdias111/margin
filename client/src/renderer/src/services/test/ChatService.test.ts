import { beforeEach, describe, expect, it, vi } from 'vitest'
import { chatService } from '../ChatService'
import { encryptionService } from '$src/services/EncryptionService'
import { webSocketService } from '$src/services/WebSocketService'
import { notificationService } from '$src/services/NotificationService'
import { navigationService } from '$src/services/NavigationService'
import { channelService } from '$src/services/ChannelService'
import { conversationsState, defaultMeta } from '$src/states/ConversationsState.svelte'
import { navigationState } from '$src/states/NavigationState.svelte'
import { sessionState } from '$src/states/SessionState.svelte'
import { usersState } from '$src/states/UsersState.svelte'
import { conversationInviteService } from '$src/states/UserListState.svelte'
import { WebSocketMessageType } from '$src/interfaces/WebSocketMessageType'
import * as api from '$src/services/api'
import { View } from '$src/interfaces/View'
import type { ConversationMessagesResponse, Message, MessageReaction } from '$src/interfaces/Messages'
import type { User } from '$src/interfaces/User'
import type { ChannelConversation, Conversation, DirectConversation } from '$src/interfaces/Conversation'
import type { Channel } from '$src/interfaces/Channel'

vi.mock('$src/services/EncryptionService', () => ({
  encryptionService: {
    decryptMessage: vi.fn(),
    encryptMessage: vi.fn(),
    getPublicKey: vi.fn()
  }
}))

vi.mock('$src/services/WebSocketService', () => ({
  webSocketService: {
    send: vi.fn()
  }
}))

vi.mock('$src/services/NotificationService', () => ({
  notificationService: {
    handleIncomingMessage: vi.fn(),
    dismissNotificationsForConversation: vi.fn()
  }
}))

vi.mock('$src/services/NavigationService', () => ({
  navigationService: {
    setView: vi.fn()
  }
}))

vi.mock('$src/services/ChannelService', () => ({
  channelService: {
    select: vi.fn()
  }
}))

vi.mock('$src/services/api', () => ({
  authenticatedGet: vi.fn(),
  authenticatedPost: vi.fn()
}))

function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    handle: 'lucas',
    displayName: 'Lucas',
    email: 'lucas@margin.chat',
    createdAt: '2025-01-01T00:00:00Z',
    profilePictureUrl: null,
    isOnline: true,
    ...overrides
  }
}

function buildMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: 100,
    conversationId: 10,
    user: buildUser(),
    content: 'encrypted-content',
    conversationType: 'DIRECT',
    isEdited: false,
    createdAt: '2025-06-01T12:00:00Z',
    reactions: [],
    ...overrides
  }
}

function buildDirectConversation(overrides: Partial<DirectConversation> = {}): DirectConversation {
  return {
    id: 10,
    type: 'DIRECT',
    otherUserId: 2,
    otherUserReadAt: '2025-01-01T00:00:00Z',
    inviteStatus: 'ACCEPTED',
    createdAt: '2025-06-01T12:00:00Z',
    ...overrides
  }
}

function buildChannelConversation(
  overrides: Partial<ChannelConversation> = {}
): ChannelConversation {
  return {
    id: 20,
    type: 'CHANNEL',
    channelId: 5,
    name: 'general',
    createdAt: '2025-06-01T12:00:00Z',
    ...overrides
  }
}

function buildChannel(overrides: Partial<Channel> = {}): Channel {
  return {
    id: 5,
    conversationId: 20,
    name: 'general',
    description: 'General channel',
    spaceId: 1,
    type: 'Communication',
    ...overrides
  }
}

function buildReaction(overrides: Partial<MessageReaction> = {}): MessageReaction {
  return {
    id: 1,
    messageId: 100,
    conversationId: 10,
    userId: 2,
    displayName: 'Other User',
    emoji: '👍',
    ...overrides
  }
}

function mockApiGet(body: ConversationMessagesResponse | unknown, ok = true): void {
  vi.mocked(api.authenticatedGet).mockResolvedValue({
    ok,
    json: async () => body
  } as Response)
}

function mockApiPost(body: Conversation | unknown, ok = true): void {
  vi.mocked(api.authenticatedPost).mockResolvedValue({
    ok,
    json: async () => body
  } as Response)
}

describe('ChatService', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    conversationsState.clear()

    navigationState.view = View.Private
    navigationState.selectedUser = null
    navigationState.selectedChannel = null
    navigationState.selectedMargin = null
    navigationState.selectedSpace = null

    sessionState.currentUser = buildUser({ id: 1 })

    usersState.reset()

    conversationInviteService.pendingInvites = []
  })

  describe('handleIncomingMessage', () => {
    it('routes channel messages to channel handler and notifies', async () => {
      const msg = buildMessage({
        id: 200,
        conversationType: 'CHANNEL',
        conversationId: 99,
        user: buildUser({ id: 2 })
      })

      await chatService.handleIncomingMessage({
        type: WebSocketMessageType.RECEIVE_MESSAGE,
        timestamp: 0,
        payload: msg
      })

      expect(conversationsState.messagesByConversationId.get(99)).toContainEqual(msg)
      expect(notificationService.handleIncomingMessage).toHaveBeenCalledWith(msg)
    })

    it('routes direct messages to direct handler', async () => {
      const sender = buildUser({ id: 2 })
      navigationState.selectedUser = sender
      vi.mocked(encryptionService.decryptMessage).mockResolvedValue('hello')
      mockApiPost({})
      const msg = buildMessage({ id: 201, conversationType: 'DIRECT', user: sender })

      await chatService.handleIncomingMessage({
        type: WebSocketMessageType.RECEIVE_MESSAGE,
        timestamp: 0,
        payload: msg
      })

      expect(encryptionService.decryptMessage).toHaveBeenCalled()
      expect(conversationsState.messagesByConversationId.get(10)).toBeDefined()
    })
  })

  describe('handleIncomingChannelMessage', () => {
    it('appends incoming channel message and marks unread when not active', async () => {
      const msg = buildMessage({
        id: 1,
        conversationType: 'CHANNEL',
        conversationId: 99,
        user: buildUser({ id: 2 })
      })

      await chatService.handleIncomingMessage({
        type: WebSocketMessageType.RECEIVE_MESSAGE,
        timestamp: 0,
        payload: msg
      })

      expect(conversationsState.messagesByConversationId.get(99)).toEqual([msg])
      expect(conversationsState.conversationMetaById.get(99)?.unread).toBe(true)
    })

    it('marks read when active and window focused', async () => {
      vi.spyOn(document, 'hasFocus').mockReturnValue(true)
      mockApiPost({})
      navigationState.selectedChannel = buildChannel({ conversationId: 99 })
      const msg = buildMessage({
        id: 1,
        conversationType: 'CHANNEL',
        conversationId: 99,
        user: buildUser({ id: 2 })
      })

      await chatService.handleIncomingMessage({
        type: WebSocketMessageType.RECEIVE_MESSAGE,
        timestamp: 0,
        payload: msg
      })

      expect(api.authenticatedPost).toHaveBeenCalledWith(null, 'conversations/99/read')
    })

    it('replaces optimistic message instead of appending when from me', async () => {
      const optimistic = buildMessage({
        id: -123,
        conversationType: 'CHANNEL',
        conversationId: 99,
        user: sessionState.currentUser!
      })
      conversationsState.messagesByConversationId.set(99, [optimistic])
      const real = buildMessage({
        id: 5,
        conversationType: 'CHANNEL',
        conversationId: 99,
        user: sessionState.currentUser!,
        content: 'real content'
      })

      await chatService.handleIncomingMessage({
        type: WebSocketMessageType.RECEIVE_MESSAGE,
        timestamp: 0,
        payload: real
      })

      const messages = conversationsState.messagesByConversationId.get(99)!
      expect(messages).toHaveLength(1)
      expect(messages[0].id).toBe(5)
      expect(messages[0].content).toBe('real content')
    })
  })

  describe('handleIncomingDirectMessage', () => {
    it('decrypts and appends when from another user in the active conversation', async () => {
      const sender = buildUser({ id: 2 })
      navigationState.selectedUser = sender
      mockApiPost({})
      vi.mocked(encryptionService.decryptMessage).mockResolvedValue('decrypted hi')
      const msg = buildMessage({
        id: 1,
        conversationType: 'DIRECT',
        conversationId: 10,
        user: sender,
        content: 'cipher'
      })

      await chatService.handleIncomingMessage({
        type: WebSocketMessageType.RECEIVE_MESSAGE,
        timestamp: 0,
        payload: msg
      })

      expect(encryptionService.decryptMessage).toHaveBeenCalledWith('cipher', true)
      expect(conversationsState.messagesByConversationId.get(10)?.[0].content).toBe('decrypted hi')
    })

    it('falls back to placeholder content when decryption throws', async () => {
      const sender = buildUser({ id: 2 })
      navigationState.selectedUser = sender
      mockApiPost({})
      vi.mocked(encryptionService.decryptMessage).mockRejectedValue(new Error('fail'))
      const msg = buildMessage({
        id: 1,
        conversationType: 'DIRECT',
        conversationId: 10,
        user: sender
      })

      await chatService.handleIncomingMessage({
        type: WebSocketMessageType.RECEIVE_MESSAGE,
        timestamp: 0,
        payload: msg
      })

      expect(conversationsState.messagesByConversationId.get(10)?.[0].content).toBe(
        '[Decryption failed]'
      )
    })

    it('bails when own message echo arrives but no recipient is selected', async () => {
      const msg = buildMessage({
        id: 1,
        conversationType: 'DIRECT',
        user: sessionState.currentUser!
      })

      await chatService.handleIncomingMessage({
        type: WebSocketMessageType.RECEIVE_MESSAGE,
        timestamp: 0,
        payload: msg
      })

      expect(conversationsState.messagesByConversationId.get(10)).toBeUndefined()
    })

    it('replaces optimistic when echo of own message arrives in active conversation', async () => {
      const me = sessionState.currentUser!
      const otherUser = buildUser({ id: 2 })
      navigationState.selectedUser = otherUser
      mockApiPost({})
      vi.mocked(encryptionService.decryptMessage).mockResolvedValue('hello')
      const optimistic = buildMessage({
        id: -123,
        conversationType: 'DIRECT',
        conversationId: 10,
        user: me
      })
      conversationsState.messagesByConversationId.set(10, [optimistic])
      const real = buildMessage({
        id: 5,
        conversationType: 'DIRECT',
        conversationId: 10,
        user: me,
        content: 'enc'
      })

      await chatService.handleIncomingMessage({
        type: WebSocketMessageType.RECEIVE_MESSAGE,
        timestamp: 0,
        payload: real
      })

      const messages = conversationsState.messagesByConversationId.get(10)!
      expect(messages).toHaveLength(1)
      expect(messages[0].id).toBe(5)
    })

    it('notifies when DM arrives for non-active conversation', async () => {
      const sender = buildUser({ id: 2 })
      vi.mocked(encryptionService.decryptMessage).mockResolvedValue('hello')
      const msg = buildMessage({ id: 1, conversationType: 'DIRECT', user: sender })

      await chatService.handleIncomingMessage({
        type: WebSocketMessageType.RECEIVE_MESSAGE,
        timestamp: 0,
        payload: msg
      })

      expect(notificationService.handleIncomingMessage).toHaveBeenCalledWith(msg)
    })
  })

  describe('loadConversationForUser', () => {
    it('skips load when messages are already cached', async () => {
      mockApiPost({})
      const conv = buildDirectConversation({ id: 10, otherUserId: 2 })
      conversationsState.byId.set(10, conv)
      conversationsState.messagesByConversationId.set(10, [
        buildMessage({ id: 1 }),
        buildMessage({ id: 2 })
      ])

      conversationsState.conversationMetaById.set(conv.id, {
        ...(conversationsState.conversationMetaById.get(conv.id) ?? defaultMeta()),
        initialFetchCompleted: true
      })

      await chatService.loadConversationForUser(buildUser({ id: 2 }))

      expect(api.authenticatedGet).not.toHaveBeenCalled()
    })

    it('fetches messages when not cached', async () => {
      vi.mocked(encryptionService.decryptMessage).mockImplementation(async (s) => s)
      const conv = buildDirectConversation({ id: 10, otherUserId: 2 })
      mockApiGet({ conversation: conv, messages: [buildMessage({ id: 1, content: 'hi' })] })
      mockApiPost({})

      await chatService.loadConversationForUser(buildUser({ id: 2 }))

      expect(api.authenticatedGet).toHaveBeenCalledWith(
        expect.stringContaining('conversations/2/direct_messages')
      )
      expect(conversationsState.byId.get(10)).toEqual(conv)
      expect(conversationsState.messagesByConversationId.get(10)).toHaveLength(1)
    })

    it('forces fetch when force=true even if messages cached', async () => {
      vi.mocked(encryptionService.decryptMessage).mockImplementation(async (s) => s)
      const conv = buildDirectConversation({ id: 10, otherUserId: 2 })
      conversationsState.byId.set(10, conv)
      conversationsState.messagesByConversationId.set(10, [buildMessage()])
      mockApiGet({ conversation: conv, messages: [] })
      mockApiPost({})

      await chatService.loadConversationForUser(buildUser({ id: 2 }), true)

      expect(api.authenticatedGet).toHaveBeenCalled()
    })
  })

  describe('loadConversationForChannel', () => {
    it('skips load when messages cached', async () => {
      const channel = buildChannel({ conversationId: 20 })
      conversationsState.messagesByConversationId.set(20, [
        buildMessage({ id: 1 }),
        buildMessage({ id: 2 })
      ])

      conversationsState.conversationMetaById.set(channel.conversationId, {
        ...(conversationsState.conversationMetaById.get(channel.conversationId) ?? defaultMeta()),
        initialFetchCompleted: true
      })

      await chatService.loadConversationForChannel(channel)

      expect(api.authenticatedGet).not.toHaveBeenCalled()
    })

    it('fetches when not cached', async () => {
      const channel = buildChannel()
      mockApiGet({ conversation: buildChannelConversation(), messages: [] })
      mockApiPost({})

      await chatService.loadConversationForChannel(channel)

      expect(api.authenticatedGet).toHaveBeenCalledWith(expect.stringContaining('channel_messages'))
    })
  })

  describe('loadMessages (via loadConversationForUser)', () => {
    it('sets isLoading=false after load and hasMore=true when page is full', async () => {
      vi.mocked(encryptionService.decryptMessage).mockImplementation(async (s) => s)
      mockApiGet({
        conversation: buildDirectConversation({ id: 10 }),
        messages: Array.from({ length: 30 }, (_, i) => buildMessage({ id: i + 1 }))
      })
      mockApiPost({})

      await chatService.loadConversationForUser(buildUser({ id: 2 }))

      expect(conversationsState.conversationMetaById.get(10)?.hasMore).toBe(true)
      expect(conversationsState.conversationMetaById.get(10)?.isLoading).toBe(false)
    })

    it('sets hasMore=false when fewer than PAGE_SIZE returned', async () => {
      vi.mocked(encryptionService.decryptMessage).mockImplementation(async (s) => s)
      mockApiGet({
        conversation: buildDirectConversation({ id: 10 }),
        messages: [buildMessage({ id: 1 })]
      })
      mockApiPost({})

      await chatService.loadConversationForUser(buildUser({ id: 2 }))

      expect(conversationsState.conversationMetaById.get(10)?.hasMore).toBe(false)
    })

    it('does not throw on non-ok response', async () => {
      mockApiGet({}, false)

      await expect(chatService.loadConversationForUser(buildUser({ id: 2 }))).resolves.not.toThrow()
    })
  })

  describe('sendMessage', () => {
    it('encrypts DM, sends via WebSocket, returns optimistic message', async () => {
      vi.mocked(encryptionService.getPublicKey).mockResolvedValue('PK')
      vi.mocked(encryptionService.encryptMessage).mockResolvedValue('cipher')
      const conv = buildDirectConversation({ id: 10, otherUserId: 2 })

      const msg = await chatService.sendMessage(sessionState.currentUser!, conv, 'plain hello')

      expect(encryptionService.encryptMessage).toHaveBeenCalled()
      expect(webSocketService.send).toHaveBeenCalledWith({
        type: WebSocketMessageType.SEND_MESSAGE,
        recipientId: 10,
        payload: { content: 'cipher', imageAddress: null }
      })
      expect(msg.id).toBeLessThan(0)
      expect(msg.content).toBe('plain hello')
    })
  })

  describe('sendChannelMessage', () => {
    it('does not encrypt, sends via WebSocket, returns optimistic', async () => {
      const channel = buildChannel({ conversationId: 20 })

      const msg = await chatService.sendChannelMessage(sessionState.currentUser!, channel, 'hi all')

      expect(encryptionService.encryptMessage).not.toHaveBeenCalled()
      expect(webSocketService.send).toHaveBeenCalledWith({
        type: WebSocketMessageType.SEND_MESSAGE,
        recipientId: 20,
        payload: { content: 'hi all', imageAddress: null }
      })
      expect(msg.id).toBeLessThan(0)
      expect(msg.conversationType).toBe('CHANNEL')
    })
  })

  describe('sendMessageAndStartConversation', () => {
    it('posts API and returns conversation + optimistic', async () => {
      vi.mocked(encryptionService.getPublicKey).mockResolvedValue('PK')
      vi.mocked(encryptionService.encryptMessage).mockResolvedValue('cipher')
      const newConv = buildDirectConversation({ id: 99, otherUserId: 2 })
      mockApiPost(newConv)

      const result = await chatService.sendMessageAndStartConversation(
        sessionState.currentUser!,
        2,
        'hi'
      )

      expect(api.authenticatedPost).toHaveBeenCalledWith(
        { recipientUserId: 2, encryptedContent: 'cipher' },
        'conversations/create_private'
      )
      expect(result.conversation).toEqual(newConv)
      expect(result.message.id).toBeLessThan(0)
    })
  })

  describe('deleteMessage', () => {
    it('sends WebSocket delete message and removes it from state', async () => {
      const msg = buildMessage({ id: 5, conversationId: 10 })
      const otherMsg = buildMessage({ id: 6, conversationId: 10 })
      conversationsState.messagesByConversationId.set(10, [msg, otherMsg])

      await chatService.deleteMessage(msg)

      expect(webSocketService.send).toHaveBeenCalledWith({
        type: WebSocketMessageType.SEND_DELETE_MESSAGE,
        recipientId: 10,
        payload: '5'
      })
      expect(conversationsState.messagesByConversationId.get(10)).toEqual([otherMsg])
    })
  })

  describe('editMessagePrivateMessage', () => {
    it('encrypts new content and sends WebSocket edit', async () => {
      vi.mocked(encryptionService.getPublicKey).mockResolvedValue('PK')
      vi.mocked(encryptionService.encryptMessage).mockResolvedValue('cipher')
      const msg = buildMessage({ id: 5, conversationId: 10 })

      await chatService.editMessagePrivateMessage(msg, 'new content', 2)

      expect(webSocketService.send).toHaveBeenCalledWith({
        type: WebSocketMessageType.SEND_EDIT_MESSAGE,
        recipientId: 10,
        payload: { messageId: 5, content: 'cipher' }
      })
    })
  })

  describe('editChannelMessage', () => {
    it('sends plaintext edit', async () => {
      const msg = buildMessage({ id: 5, conversationId: 20 })

      await chatService.editChannelMessage(msg, 'new content')

      expect(webSocketService.send).toHaveBeenCalledWith({
        type: WebSocketMessageType.SEND_EDIT_MESSAGE,
        recipientId: 20,
        payload: { messageId: 5, content: 'new content' }
      })
    })
  })

  describe('reactions', () => {
    it('addReaction sends WS message', () => {
      const msg = buildMessage({ id: 5, conversationId: 10 })

      chatService.addReaction(msg, '👍')

      expect(webSocketService.send).toHaveBeenCalledWith({
        type: WebSocketMessageType.SEND_ADD_REACTION,
        recipientId: 10,
        payload: { messageId: 5, emoji: '👍' }
      })
    })

    it('removeReaction sends WS message', () => {
      const msg = buildMessage({ id: 5, conversationId: 10 })

      chatService.removeReaction(msg, '👍')

      expect(webSocketService.send).toHaveBeenCalledWith({
        type: WebSocketMessageType.SEND_REMOVE_REACTION,
        recipientId: 10,
        payload: { messageId: 5, emoji: '👍' }
      })
    })

    it('handleIncomingReactionAdded appends to message in current conversation', () => {
      const conv = buildDirectConversation({ id: 10, otherUserId: 2 })
      conversationsState.byId.set(10, conv)
      const msg = buildMessage({ id: 100, conversationId: 10, reactions: [] })
      conversationsState.messagesByConversationId.set(10, [msg])
      navigationState.view = View.Private
      navigationState.selectedUser = buildUser({ id: 2 })

      chatService.handleIncomingReactionAdded(
        buildReaction({ messageId: 100, userId: 3, emoji: '❤️' })
      )

      const stored = conversationsState.messagesByConversationId.get(10)![0]
      expect(stored.reactions).toHaveLength(1)
      expect(stored.reactions[0].emoji).toBe('❤️')
    })

    it('handleIncomingReactionAdded does not duplicate same user+emoji', () => {
      const conv = buildDirectConversation({ id: 10, otherUserId: 2 })
      conversationsState.byId.set(10, conv)
      const existing = buildReaction({ messageId: 100, userId: 3, emoji: '❤️' })
      const msg = buildMessage({ id: 100, conversationId: 10, reactions: [existing] })
      conversationsState.messagesByConversationId.set(10, [msg])
      navigationState.view = View.Private
      navigationState.selectedUser = buildUser({ id: 2 })

      chatService.handleIncomingReactionAdded(
        buildReaction({ messageId: 100, userId: 3, emoji: '❤️' })
      )

      expect(conversationsState.messagesByConversationId.get(10)![0].reactions).toHaveLength(1)
    })

    it('handleIncomingReactionRemoved removes matching reaction', () => {
      const conv = buildDirectConversation({ id: 10, otherUserId: 2 })
      conversationsState.byId.set(10, conv)
      const reaction = buildReaction({ messageId: 100, userId: 3, emoji: '❤️' })
      const msg = buildMessage({ id: 100, conversationId: 10, reactions: [reaction] })
      conversationsState.messagesByConversationId.set(10, [msg])
      navigationState.view = View.Private
      navigationState.selectedUser = buildUser({ id: 2 })

      chatService.handleIncomingReactionRemoved(reaction)

      expect(conversationsState.messagesByConversationId.get(10)![0].reactions).toHaveLength(0)
    })
  })

  describe('markConversationAsRead', () => {
    it('posts API, marks read in state, dismisses OS notifications', async () => {
      mockApiPost({})
      conversationsState.markUnread(10)

      await chatService.markConversationAsRead(10)

      expect(api.authenticatedPost).toHaveBeenCalledWith(null, 'conversations/10/read')
      expect(conversationsState.conversationMetaById.get(10)?.unread).toBe(false)
      expect(notificationService.dismissNotificationsForConversation).toHaveBeenCalledWith(10)
    })

    it('does nothing for falsy conversationId', async () => {
      await chatService.markConversationAsRead(0)

      expect(api.authenticatedPost).not.toHaveBeenCalled()
    })
  })

  describe('invites', () => {
    it('handleIncomingConversationInvite adds to pending', () => {
      const invite = {
        conversation: buildDirectConversation({ id: 50 }),
        fromUser: buildUser({ id: 7 })
      }

      chatService.handleIncomingConversationInvite({
        type: WebSocketMessageType.CONVERSATION_INVITE,
        timestamp: 0,
        payload: invite
      })

      expect(conversationInviteService.pendingInvites).toContainEqual(invite)
    })

    it('sendConversationInvite posts to API', async () => {
      mockApiPost({})

      await chatService.sendConversationInvite('alice')

      expect(api.authenticatedPost).toHaveBeenCalledWith(
        { handle: 'alice' },
        'conversations/invite'
      )
    })

    it('acceptConversationInvite removes invite, seeds user + conversation, marks accepted', async () => {
      mockApiPost({})
      const fromUser = buildUser({ id: 7 })
      const conv = buildDirectConversation({ id: 50, otherUserId: 7, inviteStatus: 'PENDING' })
      const invite = { conversation: conv, fromUser }
      conversationInviteService.addPendingInvite(invite)

      await chatService.acceptConversationInvite(invite)

      expect(conversationInviteService.pendingInvites).toHaveLength(0)
      expect(usersState.byId.get(7)).toEqual(fromUser)
      const stored = conversationsState.byId.get(50) as DirectConversation
      expect(stored.type).toBe('DIRECT')
      expect(stored.inviteStatus).toBe('ACCEPTED')
      expect(conversationsState.conversationMetaById.has(50)).toBe(true)
    })

    // Regression: invite payload had otherUserId set to recipient (sender's perspective).
    // After accept, UsersList looked up usersState.byId.get(otherUserId) and missed,
    // filtering the conversation out until refresh. Pin otherUserId to fromUser.id.
    it('acceptConversationInvite pins otherUserId to fromUser.id', async () => {
      mockApiPost({})
      const fromUser = buildUser({ id: 7 })
      const conv = buildDirectConversation({
        id: 50,
        otherUserId: 1,
        inviteStatus: 'PENDING'
      })
      const invite = { conversation: conv, fromUser }
      conversationInviteService.addPendingInvite(invite)

      await chatService.acceptConversationInvite(invite)

      const stored = conversationsState.byId.get(50) as DirectConversation
      expect(stored.otherUserId).toBe(7)
    })

    it('declineConversationInvite removes the invite', async () => {
      mockApiPost({})
      const invite = {
        conversation: buildDirectConversation({ id: 50 }),
        fromUser: buildUser({ id: 7 })
      }
      conversationInviteService.addPendingInvite(invite)

      await chatService.declineConversationInvite(50)

      expect(conversationInviteService.pendingInvites).toHaveLength(0)
    })

    it('loadPendingInvites fetches and adds each', async () => {
      const invites = [
        {
          conversation: buildDirectConversation({ id: 50 }),
          fromUser: buildUser({ id: 7 })
        },
        {
          conversation: buildDirectConversation({ id: 51 }),
          fromUser: buildUser({ id: 8 })
        }
      ]
      mockApiGet(invites)

      await chatService.loadPendingInvites()

      expect(conversationInviteService.pendingInvites).toHaveLength(2)
    })
  })

  describe('selectContent', () => {
    it('calls navigationService.setView with the new view', () => {
      chatService.selectContent(View.Margin)

      expect(navigationService.setView).toHaveBeenCalledWith(View.Margin)
    })

    it('clears selectedUser when changing views', () => {
      navigationState.view = View.Private
      navigationState.selectedUser = buildUser({ id: 2 })

      chatService.selectContent(View.Margin)

      expect(navigationState.selectedUser).toBeNull()
    })

    it('does not clear selectedUser when selecting the same view', () => {
      navigationState.view = View.Private
      const user = buildUser({ id: 2 })
      navigationState.selectedUser = user

      chatService.selectContent(View.Private)

      expect(navigationState.selectedUser).toEqual(user)
    })

    it('always clears selected channel', () => {
      chatService.selectContent(View.Margin)

      expect(channelService.select).toHaveBeenCalledWith(null)
    })
  })

  describe('setConversationReadAt', () => {
    it('updates otherUserReadAt for matching DIRECT conversation when current', () => {
      const conv = buildDirectConversation({ id: 10, otherUserId: 2, otherUserReadAt: 'old' })
      conversationsState.byId.set(10, conv)
      navigationState.view = View.Private
      navigationState.selectedUser = buildUser({ id: 2 })

      chatService.setConversationReadAt(10, 'new')

      const stored = conversationsState.byId.get(10) as DirectConversation
      expect(stored.otherUserReadAt).toBe('new')
    })

    it('does nothing when conversation id does not match current', () => {
      const conv = buildDirectConversation({ id: 10, otherUserId: 2, otherUserReadAt: 'old' })
      conversationsState.byId.set(10, conv)
      navigationState.view = View.Private
      navigationState.selectedUser = buildUser({ id: 2 })

      chatService.setConversationReadAt(99, 'new')

      const stored = conversationsState.byId.get(10) as DirectConversation
      expect(stored.otherUserReadAt).toBe('old')
    })

    it('does not throw when current conversation is a channel', () => {
      const conv = buildChannelConversation({ id: 10 })
      conversationsState.byId.set(10, conv)
      navigationState.selectedChannel = buildChannel({ conversationId: 10 })

      expect(() => chatService.setConversationReadAt(10, 'new')).not.toThrow()
    })
  })

  describe('regression: optimistic-replace does not POST /read when nothing is unread', () => {
    // When user A sends a DM, the WebSocket echoes the message back. The handler
    // used to unconditionally call markConversationAsRead in the active+focused
    // case, which POSTed /read to the server, which then broadcast CONVERSATION_READ
    // to user B. B's setConversationReadAt cleared their unread badge for the
    // message they just received. We now skip the POST when meta.unread is false.
    it('skips POST /read on own DM echo when nothing is unread locally', async () => {
      const me = sessionState.currentUser!
      const otherUser = buildUser({ id: 2 })
      navigationState.selectedUser = otherUser
      vi.spyOn(document, 'hasFocus').mockReturnValue(true)
      vi.mocked(encryptionService.decryptMessage).mockResolvedValue('hello')
      const optimistic = buildMessage({
        id: -123,
        conversationType: 'DIRECT',
        conversationId: 10,
        user: me
      })
      conversationsState.messagesByConversationId.set(10, [optimistic])
      const real = buildMessage({ id: 5, conversationType: 'DIRECT', conversationId: 10, user: me })

      await chatService.handleIncomingMessage({
        type: WebSocketMessageType.RECEIVE_MESSAGE,
        timestamp: 0,
        payload: real
      })

      expect(api.authenticatedPost).not.toHaveBeenCalled()
    })

    it('still POSTs /read on own DM echo if there were unread messages locally', async () => {
      const me = sessionState.currentUser!
      const otherUser = buildUser({ id: 2 })
      navigationState.selectedUser = otherUser
      vi.spyOn(document, 'hasFocus').mockReturnValue(true)
      vi.mocked(encryptionService.decryptMessage).mockResolvedValue('hello')
      mockApiPost({})
      conversationsState.markUnread(10)
      const optimistic = buildMessage({
        id: -123,
        conversationType: 'DIRECT',
        conversationId: 10,
        user: me
      })
      conversationsState.messagesByConversationId.set(10, [optimistic])
      const real = buildMessage({ id: 5, conversationType: 'DIRECT', conversationId: 10, user: me })

      await chatService.handleIncomingMessage({
        type: WebSocketMessageType.RECEIVE_MESSAGE,
        timestamp: 0,
        payload: real
      })

      expect(api.authenticatedPost).toHaveBeenCalledWith(null, 'conversations/10/read')
    })

    it('skips POST /read on own channel echo when nothing is unread locally', async () => {
      const me = sessionState.currentUser!
      navigationState.selectedChannel = buildChannel({ conversationId: 99 })
      vi.spyOn(document, 'hasFocus').mockReturnValue(true)
      const optimistic = buildMessage({
        id: -123,
        conversationType: 'CHANNEL',
        conversationId: 99,
        user: me
      })
      conversationsState.messagesByConversationId.set(99, [optimistic])
      const real = buildMessage({
        id: 5,
        conversationType: 'CHANNEL',
        conversationId: 99,
        user: me
      })

      await chatService.handleIncomingMessage({
        type: WebSocketMessageType.RECEIVE_MESSAGE,
        timestamp: 0,
        payload: real
      })

      expect(api.authenticatedPost).not.toHaveBeenCalled()
    })
  })

  describe('regression: focus check on conversation load', () => {
    // Race: user opens a DM (window focused), then alt-tabs. Message arrives during
    // load -> markUnread -> badge=1. Then loadMessages finishes and onLoaded used to
    // mark the conversation read regardless of focus, clobbering the unread.
    it('loadConversationForUser does not mark read on cached path when window unfocused', async () => {
      vi.spyOn(document, 'hasFocus').mockReturnValue(false)
      const conv = buildDirectConversation({ id: 10, otherUserId: 2 })
      conversationsState.byId.set(10, conv)
      conversationsState.messagesByConversationId.set(10, [
        buildMessage({ id: 1 }),
        buildMessage({ id: 2 })
      ])

      await chatService.loadConversationForUser(buildUser({ id: 2 }))

      expect(api.authenticatedPost).not.toHaveBeenCalled()
    })

    it('loadConversationForUser does not mark read after fetch when window unfocused', async () => {
      vi.spyOn(document, 'hasFocus').mockReturnValue(false)
      vi.mocked(encryptionService.decryptMessage).mockImplementation(async (s) => s)
      const conv = buildDirectConversation({ id: 10, otherUserId: 2 })
      mockApiGet({ conversation: conv, messages: [buildMessage({ id: 1 })] })

      await chatService.loadConversationForUser(buildUser({ id: 2 }))

      expect(api.authenticatedPost).not.toHaveBeenCalled()
    })

    it('loadConversationForChannel does not mark read on cached path when window unfocused', async () => {
      vi.spyOn(document, 'hasFocus').mockReturnValue(false)
      const channel = buildChannel({ conversationId: 20 })
      conversationsState.messagesByConversationId.set(20, [
        buildMessage({ id: 1 }),
        buildMessage({ id: 2 })
      ])

      await chatService.loadConversationForChannel(channel)

      expect(api.authenticatedPost).not.toHaveBeenCalled()
    })

    it('loadConversationForChannel does not mark read after fetch when window unfocused', async () => {
      vi.spyOn(document, 'hasFocus').mockReturnValue(false)
      const channel = buildChannel({ conversationId: 20 })
      mockApiGet({
        conversation: buildChannelConversation({ id: 20 }),
        messages: [buildMessage({ id: 1 })]
      })

      await chatService.loadConversationForChannel(channel)

      expect(api.authenticatedPost).not.toHaveBeenCalled()
    })
  })

  describe('regression: loadMessages preserves unread set during async gap', () => {
    // The original loadMessages captured `meta` once before setting isLoading:true,
    // then spread that snapshot after the async decryption finished — clobbering any
    // unread:true set in the meantime. We now read fresh meta each time.
    it('does not clobber unread:true that arrived during decryption', async () => {
      vi.mocked(encryptionService.decryptMessage).mockImplementation(async (content) => {
        // Simulate an unread mark landing while we're decrypting.
        conversationsState.markUnread(10)
        return content
      })
      mockApiGet({
        conversation: buildDirectConversation({ id: 10 }),
        messages: [buildMessage({ id: 1, content: 'hi' })]
      })
      mockApiPost({})

      await chatService.loadConversationForUser(buildUser({ id: 2 }))

      expect(conversationsState.conversationMetaById.get(10)?.unread).toBe(true)
    })
  })

  describe('fetchMessagesBefore', () => {
    it('returns messages and hasMore=true when full page returned', async () => {
      vi.mocked(encryptionService.decryptMessage).mockImplementation(async (s) => s)
      const conv = buildDirectConversation({ id: 10, otherUserId: 2 })
      const fullPage = Array.from({ length: 30 }, (_, i) => buildMessage({ id: i + 100 }))
      mockApiGet({ conversation: conv, messages: fullPage })

      const result = await chatService.fetchMessagesBefore(conv, 200)

      expect(result.messages).toHaveLength(30)
      expect(result.hasMore).toBe(true)
    })

    it('returns hasMore=false when fewer than PAGE_SIZE returned', async () => {
      vi.mocked(encryptionService.decryptMessage).mockImplementation(async (s) => s)
      const conv = buildDirectConversation({ id: 10, otherUserId: 2 })
      mockApiGet({ conversation: conv, messages: [buildMessage({ id: 1 })] })

      const result = await chatService.fetchMessagesBefore(conv, 200)

      expect(result.hasMore).toBe(false)
    })

    it('does not mutate conversationsState.messagesByConversationId', async () => {
      vi.mocked(encryptionService.decryptMessage).mockImplementation(async (s) => s)
      const conv = buildDirectConversation({ id: 10, otherUserId: 2 })
      const existing = [buildMessage({ id: 200 })]
      conversationsState.messagesByConversationId.set(10, existing)
      mockApiGet({ conversation: conv, messages: [buildMessage({ id: 1, content: 'older' })] })

      await chatService.fetchMessagesBefore(conv, 200)

      expect(conversationsState.messagesByConversationId.get(10)).toEqual(existing)
    })

    it('returns empty result on non-ok response', async () => {
      const conv = buildDirectConversation({ id: 10, otherUserId: 2 })
      mockApiGet({}, false)

      const result = await chatService.fetchMessagesBefore(conv, 200)

      expect(result.messages).toEqual([])
      expect(result.hasMore).toBe(false)
    })
  })
})
