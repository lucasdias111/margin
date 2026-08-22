import { render, waitFor } from '@testing-library/svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import MessagesContainer from './MessagesContainer.svelte'
import type { Message } from '$src/interfaces/Messages'
import type { Conversation } from '$src/interfaces/Conversation'
import { conversationsState } from '$src/states/ConversationsState.svelte.js'
import { sessionState } from '$src/states/SessionState.svelte'

function conversation(id: number): Conversation {
  return { id, type: 'DIRECT', otherUserId: 99 } as Conversation
}

function message(id: number, conversationId: number): Message {
  return {
    id,
    conversationId,
    conversationType: 'DIRECT',
    user: { id: 1, displayName: 'Alice', profilePictureUrl: null } as Message['user'],
    content: `message ${id}`,
    isEdited: false,
    createdAt: new Date().toISOString(),
    reactions: [],
    attachments: []
  }
}

describe('MessagesContainer reveal', () => {
  beforeEach(() => {
    sessionState.clear()
    conversationsState.clear()
    Element.prototype.scrollTo = vi.fn() as unknown as Element['scrollTo']
  })

  it('reveals the list once the initial scroll has landed', async () => {
    const { container } = render(MessagesContainer, {
      props: { messages: [message(1, 10)], conversation: conversation(10) }
    })

    await waitFor(() => expect(container.querySelector('.messages')).toHaveClass('visible'))
  })

  it('replays the reveal on every conversation switch, not just the first', async () => {
    const { container, rerender } = render(MessagesContainer, {
      props: { messages: [message(1, 10)], conversation: conversation(10) }
    })

    await waitFor(() => expect(container.querySelector('.messages')).toHaveClass('visible'))

    await rerender({ messages: [message(2, 20)], conversation: conversation(20) })
    expect(container.querySelector('.messages')).not.toHaveClass('visible')

    await waitFor(() => expect(container.querySelector('.messages')).toHaveClass('visible'))
  })

  it('reveals an empty conversation that has nothing to scroll to', async () => {
    const { container } = render(MessagesContainer, {
      props: { messages: [], conversation: conversation(30) }
    })

    await waitFor(() => expect(container.querySelector('.messages')).toHaveClass('visible'))
  })
})
