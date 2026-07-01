import { render, screen } from '@testing-library/svelte'
import { beforeEach, describe, expect, it } from 'vitest'
import MessageBubble from './MessageBubble.svelte'
import type { Message } from '$src/interfaces/Messages'
import { sessionState } from '$src/states/SessionState.svelte'
import { conversationsState } from '$src/states/ConversationsState.svelte.js'

function baseMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: 1,
    conversationId: 10,
    conversationType: 'CHANNEL',
    user: { id: 1, displayName: 'Alice', profilePictureUrl: null } as Message['user'],
    content: 'hello',
    isEdited: false,
    createdAt: new Date().toISOString(),
    reactions: [],
    attachments: [],
    ...overrides
  }
}

describe('MessageBubble', () => {
  beforeEach(() => {
    sessionState.clear()
    conversationsState.clear()
  })

  it('hides the bubble chrome for a gif sent with no text', () => {
    const message = baseMessage({ content: 'https://static.klipy.com/some-gif.gif' })

    const { container } = render(MessageBubble, {
      props: { message, onEditMessage: () => {} }
    })

    const bubble = container.querySelector('.bubble')
    expect(bubble).toHaveClass('media-only')
  })

  it('keeps the bubble chrome when a gif is sent with a caption', () => {
    const message = baseMessage({ content: 'look at this\nhttps://static.klipy.com/some-gif.gif' })

    const { container } = render(MessageBubble, {
      props: { message, onEditMessage: () => {} }
    })

    const bubble = container.querySelector('.bubble')
    expect(bubble).not.toHaveClass('media-only')
  })

  it('keeps the bubble chrome for plain text messages', () => {
    const message = baseMessage({ content: 'just some text' })

    const { container } = render(MessageBubble, {
      props: { message, onEditMessage: () => {} }
    })

    const bubble = container.querySelector('.bubble')
    expect(bubble).not.toHaveClass('media-only')
  })

  it('still renders reactions on a media-only gif message', () => {
    const message = baseMessage({
      content: 'https://static.klipy.com/some-gif.gif',
      reactions: [
        { id: 1, messageId: 1, conversationId: 10, userId: 2, displayName: 'Bob', emoji: '👍' }
      ]
    })
    conversationsState.appendMessage(message, true)

    render(MessageBubble, { props: { message, onEditMessage: () => {} } })

    expect(screen.getByTitle('Bob')).toBeInTheDocument()
  })
})
