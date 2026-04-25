import type { Message } from '$src/interfaces/Messages'
import type { Conversation } from '$src/interfaces/Conversation'
import { navigationState } from '$src/states/NavigationState.svelte'
import { View } from '$src/interfaces/View'
import { SvelteMap } from 'svelte/reactivity'

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
  private _byId = new SvelteMap<number, Conversation>()
  private _messagesByConversationId = new SvelteMap<number, Message[]>()
  private _conversationMetaById = new SvelteMap<number, ConversationMeta>()

  get byId(): SvelteMap<number, Conversation> {
    return this._byId
  }

  get messagesByConversationId(): SvelteMap<number, Message[]> {
    return this._messagesByConversationId
  }

  get conversationMetaById(): SvelteMap<number, ConversationMeta> {
    return this._conversationMetaById
  }

  appendMessage(msg: Message, incoming: boolean): void {
    const convId = msg.conversationId

    if (!this._byId.has(convId) && msg.conversationType === 'CHANNEL') {
      this._byId.set(convId, {
        id: convId,
        type: 'CHANNEL',
        channelId: -1,
        name: '',
        createdAt: msg.createdAt
      })
    }

    const existing = this._messagesByConversationId.get(convId) ?? []
    this._messagesByConversationId.set(convId, [...existing, msg])

    const meta = this._conversationMetaById.get(convId) ?? defaultMeta()
    this._conversationMetaById.set(convId, {
      ...meta,
      lastMessage: msg.content,
      lastMessageTime: msg.createdAt,
      lastMessageIncoming: incoming
    })
  }

  markUnread(convId: number): void {
    const meta = this._conversationMetaById.get(convId) ?? defaultMeta()
    this._conversationMetaById.set(convId, { ...meta, unread: true })
  }

  markRead(convId: number, lastReadAt: string): void {
    const meta = this._conversationMetaById.get(convId)
    if (!meta) return
    if (meta.unread === false && meta.lastReadAt === lastReadAt) return
    this._conversationMetaById.set(convId, { ...meta, unread: false, lastReadAt })
  }

  reset(conversationId: number): void {
    this._messagesByConversationId.set(conversationId, [])
    this._conversationMetaById.set(conversationId, defaultMeta())
  }

  clear(): void {
    this._byId.clear()
    this._messagesByConversationId.clear()
    this._conversationMetaById.clear()
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
    const messages = this._messagesByConversationId.get(message.conversationId)
    if (!messages) return
    this._messagesByConversationId.set(
      message.conversationId,
      messages.filter((m) => m.id !== message.id)
    )
  }
}

export const conversationsState = new ConversationsState()
