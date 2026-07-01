import { SvelteMap } from 'svelte/reactivity'

export interface TypingUser {
  userId: number
  displayName: string
}

class TypingIndicatorState {
  private _byConversationId = new SvelteMap<number, TypingUser[]>()

  get byConversationId(): SvelteMap<number, TypingUser[]> {
    return this._byConversationId
  }

  setTyping(conversationId: number, user: TypingUser): void {
    const existing = this._byConversationId.get(conversationId) ?? []
    if (existing.some((u) => u.userId === user.userId)) return
    this._byConversationId.set(conversationId, [...existing, user])
  }

  clearTyping(conversationId: number, userId: number): void {
    const existing = this._byConversationId.get(conversationId)
    if (!existing) return
    this._byConversationId.set(
      conversationId,
      existing.filter((u) => u.userId !== userId)
    )
  }

  clear(): void {
    this._byConversationId.clear()
  }
}

export const typingIndicatorState = new TypingIndicatorState()
