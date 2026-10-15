import { beforeEach, describe, expect, it } from 'vitest'
import { conversationsState } from '$src/states/ConversationsState.svelte'
import { buildMessage } from '$src/test-utils/mocks'

describe('ConversationsState.setMessageStatus', () => {
  beforeEach(() => {
    conversationsState.clear()
  })

  it('updates the status of a tracked message', () => {
    const msg = buildMessage({ id: -1, conversationId: 10, status: 'sending' })
    conversationsState.messagesByConversationId.set(10, [msg])

    conversationsState.setMessageStatus(10, -1, 'error')

    expect(conversationsState.messagesByConversationId.get(10)![0].status).toBe('error')
  })

  it('replaces the array entry rather than mutating in place (reactivity)', () => {
    const msg = buildMessage({ id: -1, conversationId: 10, status: 'sending' })
    const original = [msg]
    conversationsState.messagesByConversationId.set(10, original)

    conversationsState.setMessageStatus(10, -1, 'sent')

    const updated = conversationsState.messagesByConversationId.get(10)!
    expect(updated).not.toBe(original)
    expect(updated[0]).not.toBe(msg)
    expect(msg.status).toBe('sending')
  })

  it('does nothing when the conversation is unknown', () => {
    expect(() => conversationsState.setMessageStatus(999, -1, 'error')).not.toThrow()
  })

  it('does nothing when the message id is not found', () => {
    const msg = buildMessage({ id: -1, conversationId: 10 })
    conversationsState.messagesByConversationId.set(10, [msg])

    conversationsState.setMessageStatus(10, -2, 'error')

    expect(conversationsState.messagesByConversationId.get(10)![0].status).toBe(msg.status)
  })
})
