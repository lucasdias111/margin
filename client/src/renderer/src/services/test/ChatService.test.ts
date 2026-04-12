import { beforeEach, describe, expect, it, vi } from 'vitest'
import { chatService } from '../ChatService'
import { encryptionService } from '$src/services/EncryptionService'
import { webSocketService } from '$src/services/WebSocketService'
import { notificationService } from '$src/services/NotificationService'
import { userState } from '$src/states/UserState.svelte'
import { chatState } from '$src/states/ChatState.svelte'
import { conversationState } from '$src/states/ConversationState.svelte'
import { userListState } from '$src/states/UserListState.svelte'
import { WebSocketMessageType } from '$src/interfaces/WebSocketMessageType'
import * as api from '$src/services/api'
import type { ConversationMessagesResponse, Message } from '$src/interfaces/Messages'
import type { User } from '$src/interfaces/User'
import type { ChannelConversation, Conversation, DirectConversation } from '$src/interfaces/Conversation'
import type { Channel } from '$src/interfaces/Channel'
import type { RecentChatUser } from '$src/interfaces/RecentChatUser'
import type { ContentType } from '$src/interfaces/Content'

interface MockUserState {
  currentUser: User | null
}

interface MockChatState {
  selectedUser: User | null
  selectedChannel: Pick<Channel, 'conversationId'> | null
  currentlySelectedContent: ContentType
}

interface MockConversationState {
  currentConversation: Conversation | null
  messages: Message[]
  isLoading: boolean
  hasMore: boolean
  isLoadingMore: boolean
  selectConversation: ReturnType<typeof vi.fn>
  clear: ReturnType<typeof vi.fn>
  deleteMessage: ReturnType<typeof vi.fn>
}

interface MockUserListState {
  recentUsers: RecentChatUser[]
  updateLastMessage: ReturnType<typeof vi.fn>
  addUser: ReturnType<typeof vi.fn>
}

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
    markConversationAsRead: vi.fn()
  }
}))

vi.mock('$src/states/UserState.svelte', () => ({
  userState: {
    currentUser: null
  }
}))

vi.mock('$src/states/ChatState.svelte', () => ({
  chatState: {
    selectedUser: null,
    selectedChannel: null,
    currentlySelectedContent: 'private'
  }
}))

vi.mock('$src/states/ConversationState.svelte', () => ({
  conversationState: {
    currentConversation: null,
    messages: [],
    isLoading: false,
    hasMore: true,
    isLoadingMore: false,
    selectConversation: vi.fn(),
    clear: vi.fn(),
    deleteMessage: vi.fn()
  }
}))

vi.mock('$src/states/UserListState.svelte', () => ({
  userListState: {
    recentUsers: [],
    updateLastMessage: vi.fn(),
    addUser: vi.fn()
  }
}))

vi.mock('$src/services/api', () => ({
  authenticatedGet: vi.fn(),
  authenticatedPost: vi.fn()
}))

const mockUserState = userState as MockUserState
const mockChatState = chatState as MockChatState
const mockConversationState = conversationState as unknown as MockConversationState
const mockUserListState = userListState as unknown as MockUserListState

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
    ...overrides
  }
}

function buildDirectConversation(overrides: Partial<DirectConversation> = {}): DirectConversation {
  return <DirectConversation>{
    id: 10,
    type: 'DIRECT',
    otherUserId: 2,
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

function mockApiGet(body: ConversationMessagesResponse | Record<string, never>, ok = true): void {
  vi.mocked(api.authenticatedGet).mockResolvedValue({
    ok,
    json: async () => body
  } as Response)
}

function mockApiPost(body: Conversation | Record<string, never>, ok = true): void {
  vi.mocked(api.authenticatedPost).mockResolvedValue({
    ok,
    json: async () => body
  } as Response)
}

describe('ChatService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUserState.currentUser = buildUser()
    mockChatState.selectedUser = null
    mockChatState.selectedChannel = null
    mockChatState.currentlySelectedContent = 'private'
    mockConversationState.currentConversation = null
    mockConversationState.messages = []
    mockConversationState.isLoading = false
    mockConversationState.hasMore = true
    mockConversationState.isLoadingMore = false
    mockUserListState.recentUsers = []
  })

  describe('handleIncomingMessage', () => {
    it('delegates to notificationService for every message', async () => {
      const msg = buildMessage({ conversationType: 'CHANNEL', conversationId: 99 })

      await chatService.handleIncomingMessage({
        timestamp: 0,
        type: WebSocketMessageType.RECEIVE_MESSAGE,
        payload: msg
      })

      expect(notificationService.handleIncomingMessage).toHaveBeenCalledWith(msg)
    })

    it('appends channel message to conversationState when it matches selected channel', async () => {
      const msg = buildMessage({ conversationType: 'CHANNEL', conversationId: 20 })
      mockChatState.selectedChannel = { conversationId: 20 }
      mockConversationState.messages = []

      await chatService.handleIncomingMessage({
        timestamp: 0,
        type: WebSocketMessageType.RECEIVE_MESSAGE,
        payload: msg
      })

      expect(mockConversationState.messages).toEqual([msg])
    })

    it('does not append channel message when it does not match selected channel', async () => {
      const msg = buildMessage({ conversationType: 'CHANNEL', conversationId: 20 })
      mockChatState.selectedChannel = { conversationId: 99 }
      mockConversationState.messages = []

      await chatService.handleIncomingMessage({
        timestamp: 0,
        type: WebSocketMessageType.RECEIVE_MESSAGE,
        payload: msg
      })

      expect(mockConversationState.messages).toEqual([])
    })

    it('notifies when a DM arrives and window is blurred', async () => {
      vi.spyOn(document, 'hasFocus').mockReturnValue(false)

      const sender = buildUser({ id: 2 })
      const msg = buildMessage({
        conversationType: 'DIRECT',
        conversationId: 10,
        user: sender
      })

      mockConversationState.currentConversation = buildDirectConversation({ id: 10 })
      mockChatState.selectedUser = sender

      await chatService.handleIncomingMessage({
        timestamp: 0,
        type: WebSocketMessageType.RECEIVE_MESSAGE,
        payload: msg
      })

      expect(notificationService.handleIncomingMessage).toHaveBeenCalledWith(msg)
    })

    it('decrypts and appends DM to active conversation', async () => {
      const sender = buildUser({ id: 2, handle: 'kasper' })
      const msg = buildMessage({
        conversationType: 'DIRECT',
        conversationId: 10,
        user: sender,
        content: 'encrypted'
      })
      mockConversationState.currentConversation = buildDirectConversation({ id: 10 })
      mockConversationState.messages = []
      mockChatState.selectedUser = sender
      vi.mocked(encryptionService.decryptMessage).mockResolvedValue('decrypted')

      await chatService.handleIncomingMessage({
        timestamp: 0,
        type: WebSocketMessageType.RECEIVE_MESSAGE,
        payload: msg
      })

      expect(encryptionService.decryptMessage).toHaveBeenCalledWith('encrypted', true)
      expect(mockConversationState.messages[0].content).toBe('decrypted')
    })

    it('updates sidebar preview for DM in background conversation', async () => {
      const sender = buildUser({ id: 2, handle: 'kasper' })
      const msg = buildMessage({
        conversationType: 'DIRECT',
        conversationId: 10,
        user: sender,
        content: 'encrypted'
      })
      mockConversationState.currentConversation = buildDirectConversation({ id: 99 })
      mockChatState.selectedUser = sender
      vi.mocked(encryptionService.decryptMessage).mockResolvedValue('preview text')

      await chatService.handleIncomingMessage({
        timestamp: 0,
        type: WebSocketMessageType.RECEIVE_MESSAGE,
        payload: msg
      })

      expect(mockUserListState.updateLastMessage).toHaveBeenCalledWith(
        2,
        'preview text',
        true,
        msg.createdAt
      )
      expect(mockConversationState.messages).toEqual([])
    })

    it('adds unknown sender to recent users list', async () => {
      const sender = buildUser({ id: 3, handle: 'unknown' })
      const msg = buildMessage({
        conversationType: 'DIRECT',
        conversationId: 10,
        user: sender,
        content: 'encrypted'
      })
      mockConversationState.currentConversation = buildDirectConversation({ id: 99 })
      mockChatState.selectedUser = sender
      mockUserListState.recentUsers = []
      vi.mocked(encryptionService.decryptMessage).mockResolvedValue('hello')

      await chatService.handleIncomingMessage({
        timestamp: 0,
        type: WebSocketMessageType.RECEIVE_MESSAGE,
        payload: msg
      })

      const expectedRecentUser: RecentChatUser = {
        conversationId: 10,
        user: sender,
        lastMessage: 'hello',
        lastMessageTime: msg.createdAt,
        lastMessageIncoming: true
      }
      expect(mockUserListState.addUser).toHaveBeenCalledWith(expectedRecentUser)
    })

    it('does not add user to recent list if already present', async () => {
      const sender = buildUser({ id: 2, handle: 'kasper' })
      const msg = buildMessage({
        conversationType: 'DIRECT',
        conversationId: 10,
        user: sender,
        content: 'encrypted'
      })
      mockConversationState.currentConversation = buildDirectConversation({ id: 99 })
      mockChatState.selectedUser = sender
      mockUserListState.recentUsers = [
        {
          conversationId: 10,
          user: buildUser({ id: 2 }),
          lastMessageIncoming: true
        }
      ]
      vi.mocked(encryptionService.decryptMessage).mockResolvedValue('hello')

      await chatService.handleIncomingMessage({
        timestamp: 0,
        type: WebSocketMessageType.RECEIVE_MESSAGE,
        payload: msg
      })

      expect(mockUserListState.addUser).not.toHaveBeenCalled()
    })

    it('replaces optimistic message when server confirms own DM', async () => {
      const me = buildUser({ id: 1 })
      const msg = buildMessage({
        id: 200,
        conversationType: 'DIRECT',
        conversationId: 10,
        user: me,
        content: 'encrypted'
      })
      const optimistic = buildMessage({ id: -1000, conversationId: 10, user: me, content: 'hello' })
      mockConversationState.currentConversation = buildDirectConversation({ id: 10 })
      mockConversationState.messages = [optimistic]
      mockChatState.selectedUser = buildUser({ id: 2 })
      vi.mocked(encryptionService.decryptMessage).mockResolvedValue('hello')

      await chatService.handleIncomingMessage({
        timestamp: 0,
        type: WebSocketMessageType.RECEIVE_MESSAGE,
        payload: msg
      })

      expect(mockConversationState.messages[0].id).toBe(200)
      expect(mockConversationState.messages).toHaveLength(1)
    })

    it('sets content to [Decryption failed] when decryption throws', async () => {
      const sender = buildUser({ id: 2, handle: 'kasper' })
      const msg = buildMessage({
        conversationType: 'DIRECT',
        conversationId: 10,
        user: sender,
        content: 'bad-data'
      })

      mockConversationState.currentConversation = buildDirectConversation({ id: 10 })
      mockConversationState.messages = []
      mockChatState.selectedUser = sender

      vi.mocked(encryptionService.decryptMessage).mockRejectedValue(new Error('decrypt failed'))

      await chatService.handleIncomingMessage({
        timestamp: 0,
        type: WebSocketMessageType.RECEIVE_MESSAGE,
        payload: msg
      })

      expect(mockConversationState.messages[0].content).toBe('[Decryption failed]')
    })

    it('marks conversation as read after appending DM to active conversation', async () => {
      vi.spyOn(document, 'hasFocus').mockReturnValue(true)

      const sender = buildUser({ id: 2 })
      const msg = buildMessage({
        conversationType: 'DIRECT',
        conversationId: 10,
        user: sender
      })

      mockConversationState.currentConversation = buildDirectConversation({ id: 10 })
      mockConversationState.messages = []
      mockChatState.selectedUser = sender

      vi.mocked(encryptionService.decryptMessage).mockResolvedValue('text')
      mockApiPost({})

      await chatService.handleIncomingMessage({
        timestamp: 0,
        type: WebSocketMessageType.RECEIVE_MESSAGE,
        payload: msg
      })

      expect(api.authenticatedPost).toHaveBeenCalledWith(null, 'conversations/10/read')
    })
  })

  describe('loadConversationForUser', () => {
    it('fetches and populates messages for a user', async () => {
      const conv = buildDirectConversation({ id: 10, otherUserId: 2 })
      const messages = [
        buildMessage({ content: 'encrypted1' }),
        buildMessage({ id: 101, content: 'encrypted2' })
      ]
      mockApiGet({ conversation: conv, messages })
      vi.mocked(encryptionService.decryptMessage).mockResolvedValue('decrypted')
      mockApiPost({})

      await chatService.loadConversationForUser(buildUser({ id: 2 }))

      expect(api.authenticatedGet).toHaveBeenCalledWith('conversations/2/direct_messages?limit=30')
      expect(mockConversationState.selectConversation).toHaveBeenCalledWith(conv)
      expect(mockConversationState.messages).toHaveLength(2)
      expect(mockConversationState.isLoading).toBe(false)
    })

    it('skips loading if already viewing conversation with same user', async () => {
      mockConversationState.currentConversation = buildDirectConversation({
        id: 10,
        otherUserId: 2
      })

      await chatService.loadConversationForUser(buildUser({ id: 2 }))

      expect(api.authenticatedGet).not.toHaveBeenCalled()
    })

    it('clears state before loading', async () => {
      mockConversationState.messages = [buildMessage()]
      mockApiGet({ conversation: null as unknown as Conversation, messages: [] })

      await chatService.loadConversationForUser(buildUser({ id: 2 }))

      expect(mockConversationState.messages).toEqual([])
    })

    it('sets hasMore to false when fewer messages than PAGE_SIZE returned', async () => {
      const conv = buildDirectConversation()
      mockApiGet({ conversation: conv, messages: [buildMessage()] })
      vi.mocked(encryptionService.decryptMessage).mockResolvedValue('text')
      mockApiPost({})

      await chatService.loadConversationForUser(buildUser({ id: 2 }))

      expect(mockConversationState.hasMore).toBe(false)
    })

    it('handles API failure gracefully', async () => {
      mockApiGet({ conversation: null as unknown as Conversation, messages: [] }, false)

      await chatService.loadConversationForUser(buildUser({ id: 2 }))

      expect(mockConversationState.messages).toEqual([])
      expect(mockConversationState.isLoading).toBe(false)
    })
  })

  describe('loadConversationForChannel', () => {
    it('fetches channel messages', async () => {
      const conv = buildChannelConversation({ id: 20, channelId: 5 })
      const messages = [buildMessage({ conversationType: 'CHANNEL' })]
      mockApiGet({ conversation: conv, messages })
      mockApiPost({})

      await chatService.loadConversationForChannel(buildChannel({ id: 5, conversationId: 20 }))

      expect(api.authenticatedGet).toHaveBeenCalledWith('conversations/5/channel_messages?limit=30')
      expect(mockConversationState.selectConversation).toHaveBeenCalledWith(conv)
    })

    it('skips loading if already viewing same channel conversation', async () => {
      mockConversationState.currentConversation = buildChannelConversation({ id: 20 })

      await chatService.loadConversationForChannel(buildChannel({ id: 5, conversationId: 20 }))

      expect(api.authenticatedGet).not.toHaveBeenCalled()
    })
  })

  describe('loadMoreMessages', () => {
    it('prepends older messages to existing messages', async () => {
      const conv = buildDirectConversation({ id: 10, otherUserId: 2 })
      mockConversationState.currentConversation = conv
      const existing = buildMessage({ id: 100 })
      mockConversationState.messages = [existing]

      const olderMessages = Array.from({ length: 30 }, (_, i) =>
        buildMessage({ id: i + 1, content: `enc-${i}` })
      )
      mockApiGet({ conversation: conv, messages: olderMessages })
      vi.mocked(encryptionService.decryptMessage).mockResolvedValue('decrypted')

      await chatService.loadMoreMessages()

      expect(mockConversationState.messages).toHaveLength(31)
      expect(mockConversationState.messages[30]).toBe(existing)
    })

    it('sets hasMore to false when fewer than PAGE_SIZE returned', async () => {
      mockConversationState.currentConversation = buildDirectConversation()
      mockConversationState.messages = [buildMessage({ id: 100 })]
      mockApiGet({ conversation: buildDirectConversation(), messages: [buildMessage({ id: 1 })] })
      vi.mocked(encryptionService.decryptMessage).mockResolvedValue('text')

      await chatService.loadMoreMessages()

      expect(mockConversationState.hasMore).toBe(false)
    })

    it('does not load when already loading more', async () => {
      mockConversationState.currentConversation = buildDirectConversation()
      mockConversationState.messages = [buildMessage()]
      mockConversationState.isLoadingMore = true

      await chatService.loadMoreMessages()

      expect(api.authenticatedGet).not.toHaveBeenCalled()
    })

    it('does not load when hasMore is false', async () => {
      mockConversationState.currentConversation = buildDirectConversation()
      mockConversationState.messages = [buildMessage()]
      mockConversationState.hasMore = false

      await chatService.loadMoreMessages()

      expect(api.authenticatedGet).not.toHaveBeenCalled()
    })

    it('does not load when no current conversation', async () => {
      mockConversationState.currentConversation = null
      mockConversationState.messages = [buildMessage()]

      await chatService.loadMoreMessages()

      expect(api.authenticatedGet).not.toHaveBeenCalled()
    })
  })

  describe('sendMessage', () => {
    it('encrypts and sends DM via WebSocket', async () => {
      const conv = buildDirectConversation({ id: 10, otherUserId: 2 })
      vi.mocked(encryptionService.getPublicKey).mockResolvedValue('pub-key')
      vi.mocked(encryptionService.encryptMessage).mockResolvedValue('encrypted-payload')

      const result = await chatService.sendMessage(buildUser(), conv, 'hello')

      expect(encryptionService.encryptMessage).toHaveBeenCalledWith('hello', 'pub-key', 'pub-key')
      expect(webSocketService.send).toHaveBeenCalledWith({
        type: WebSocketMessageType.SEND_MESSAGE,
        recipientId: 10,
        payload: 'encrypted-payload'
      })
      expect(result.content).toBe('hello')
      expect(result.id).toBeLessThan(0)
    })

    it('sends channel message without encryption', async () => {
      const conv = buildChannelConversation({ id: 20 })

      const result = await chatService.sendMessage(buildUser(), conv, 'hello channel')

      expect(encryptionService.encryptMessage).not.toHaveBeenCalled()
      expect(webSocketService.send).toHaveBeenCalledWith({
        type: WebSocketMessageType.SEND_MESSAGE,
        recipientId: 20,
        payload: 'hello channel'
      })
      expect(result.content).toBe('hello channel')
    })
  })

  describe('sendChannelMessage', () => {
    it('sends via WebSocket and returns optimistic message', async () => {
      const channel = buildChannel({ id: 5, conversationId: 20 })

      const result = await chatService.sendChannelMessage(buildUser(), channel, 'hey')

      expect(webSocketService.send).toHaveBeenCalledWith({
        type: WebSocketMessageType.SEND_MESSAGE,
        recipientId: 20,
        payload: 'hey'
      })
      expect(result.conversationType).toBe('CHANNEL')
      expect(result.content).toBe('hey')
      expect(result.id).toBeLessThan(0)
    })
  })

  describe('sendMessageAndStartConversation', () => {
    it('creates conversation via API and returns optimistic message', async () => {
      const conv = buildDirectConversation({ id: 10 })
      vi.mocked(encryptionService.getPublicKey).mockResolvedValue('pub-key')
      vi.mocked(encryptionService.encryptMessage).mockResolvedValue('encrypted')
      mockApiPost(conv)

      const result = await chatService.sendMessageAndStartConversation(buildUser(), 2, 'first msg')

      expect(api.authenticatedPost).toHaveBeenCalledWith(
        { recipientUserId: 2, encryptedContent: 'encrypted' },
        'conversations/create_private'
      )
      expect(result.conversation).toEqual(conv)
      expect(result.message.content).toBe('first msg')
      expect(result.message.id).toBeLessThan(0)
    })
  })

  describe('deleteMessage', () => {
    it('sends delete via WebSocket and removes from state', async () => {
      const msg = buildMessage({ id: 100, conversationId: 10 })

      await chatService.deleteMessage(msg)

      expect(webSocketService.send).toHaveBeenCalledWith({
        type: WebSocketMessageType.SEND_DELETE_MESSAGE,
        recipientId: 10,
        payload: '100'
      })
      expect(mockConversationState.deleteMessage).toHaveBeenCalledWith(100)
    })
  })

  describe('editMessagePrivateMessage', () => {
    it('encrypts and sends edit via WebSocket', async () => {
      const msg = buildMessage({ id: 100, conversationId: 10 })
      vi.mocked(encryptionService.getPublicKey).mockResolvedValue('pub-key')
      vi.mocked(encryptionService.encryptMessage).mockResolvedValue('encrypted-edit')

      await chatService.editMessagePrivateMessage(msg, 'edited text', 2)

      expect(webSocketService.send).toHaveBeenCalledWith({
        type: WebSocketMessageType.SEND_EDIT_MESSAGE,
        recipientId: 10,
        payload: { messageId: 100, content: 'encrypted-edit' }
      })
    })
  })

  describe('editChannelMessage', () => {
    it('sends plaintext edit via WebSocket', async () => {
      const msg = buildMessage({ id: 100, conversationId: 20 })

      await chatService.editChannelMessage(msg, 'edited channel msg')

      expect(webSocketService.send).toHaveBeenCalledWith({
        type: WebSocketMessageType.SEND_EDIT_MESSAGE,
        recipientId: 20,
        payload: { messageId: 100, content: 'edited channel msg' }
      })
    })
  })

  describe('markConversationAsRead', () => {
    it('posts to API and updates notification state', async () => {
      mockApiPost({})

      await chatService.markConversationAsRead(10)

      expect(api.authenticatedPost).toHaveBeenCalledWith(null, 'conversations/10/read')
      expect(notificationService.markConversationAsRead).toHaveBeenCalledWith(10)
    })

    it('does nothing for falsy conversationId', async () => {
      await chatService.markConversationAsRead(0)

      expect(api.authenticatedPost).not.toHaveBeenCalled()
    })
  })

  describe('selectContent', () => {
    it('clears state and sets new content type', () => {
      mockChatState.currentlySelectedContent = 'private'
      mockChatState.selectedUser = buildUser({ id: 2 })

      chatService.selectContent('margin')

      expect(mockChatState.selectedUser).toBeNull()
      expect(mockConversationState.clear).toHaveBeenCalled()
      expect(mockChatState.currentlySelectedContent).toBe('margin')
      expect(mockChatState.selectedChannel).toBeNull()
    })

    it('does not clear state when selecting the same content type', () => {
      mockChatState.currentlySelectedContent = 'private'

      chatService.selectContent('private')

      expect(mockConversationState.clear).not.toHaveBeenCalled()
      expect(mockChatState.currentlySelectedContent).toBe('private')
    })
  })
})
