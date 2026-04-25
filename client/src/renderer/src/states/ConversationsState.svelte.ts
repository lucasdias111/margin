import type { Message } from '$src/interfaces/Messages'
import type { Conversation } from '$src/interfaces/Conversation'
import { navigationState } from '$src/states/NavigationState.svelte'
import { View } from '$src/interfaces/View'

export interface ConversationMeta {
  hasMore: boolean
  isLoading: boolean
  lastMessage: string | null
  lastMessageTime: string | null
  lastMessageIncoming: boolean
  unread: boolean
  lastReadAt: string | null
}

export const defaultMeta = (): ConversationMeta => ({
  hasMore: true,
  isLoading: false,
  lastMessage: null,
  lastMessageTime: null,
  lastMessageIncoming: false,
  unread: false,
  lastReadAt: null
})

class ConversationsState {
  private _byId = $state<Map<number, Conversation>>(new Map())
  private _messagesByConversationId = $state<Map<number, Message[]>>(new Map())
  private _conversationMetaById = $state<Map<number, ConversationMeta>>(new Map())

  get byId(): Map<number, Conversation> {
    return this._byId
  }

  set byId(value: Map<number, Conversation>) {
    this._byId = value
  }

  get messagesByConversationId(): Map<number, Message[]> {
    return this._messagesByConversationId
  }

  set messagesByConversationId(value: Map<number, Message[]>) {
    this._messagesByConversationId = value
  }

  get conversationMetaById(): Map<number, ConversationMeta> {
    return this._conversationMetaById
  }

  set conversationMetaById(value: Map<number, ConversationMeta>) {
    this._conversationMetaById = value
  }

  appendMessage(msg: Message, incoming: boolean): void {
    const convId = msg.conversationId
    const existing = this._messagesByConversationId.get(convId) ?? []
    this._messagesByConversationId.set(convId, [...existing, msg])
    this._messagesByConversationId = new Map(this._messagesByConversationId)

    const meta = this._conversationMetaById.get(convId) ?? defaultMeta()
    this._conversationMetaById.set(convId, {
      ...meta,
      lastMessage: msg.content,
      lastMessageTime: msg.createdAt,
      lastMessageIncoming: incoming,
      unread: incoming && this.currentConversation?.id !== convId
    })
    this._conversationMetaById = new Map(this._conversationMetaById)
  }

  markUnread(convId: number): void {
    const meta = this._conversationMetaById.get(convId)
    if (!meta) return
    this._conversationMetaById.set(convId, { ...meta, unread: true })
    this._conversationMetaById = new Map(this._conversationMetaById)
  }

  markRead(convId: number, lastReadAt: string): void {
    const meta = this._conversationMetaById.get(convId)
    if (!meta) return
    this._conversationMetaById.set(convId, { ...meta, unread: false, lastReadAt })
    this._conversationMetaById = new Map(this._conversationMetaById)
  }

  reset(conversationId: number): void {
    this._messagesByConversationId.set(conversationId, [])
    this._conversationMetaById.set(conversationId, defaultMeta())
  }

  get currentConversation(): Conversation | undefined {
    if (navigationState.view === View.Private && navigationState.selectedUser) {
      for (const conv of this._byId.values()) {
        if (conv.type === 'DIRECT' && conv.otherUserId === navigationState.selectedUser.id) {
          return conv
        }
      }
    }

    if (navigationState.selectedChannel) {
      return this._byId.get(navigationState.selectedChannel.conversationId)
    }

    return undefined
  }

  deleteMessage(message: Message): void {
    const messages = this.messagesByConversationId.get(message.conversationId)
    messages.filter((message) => message.id !== message.id)
  }
}

export const conversationsState = new ConversationsState()
