import { beforeEach, describe, expect, it } from 'vitest'
import { threadsState } from '../ThreadsState.svelte'
import { buildThreadConversation, buildUser } from '$src/test-utils/mocks'
import type { ThreadSummary } from '$src/interfaces/Thread'

function buildSummary(overrides: Partial<ThreadSummary> = {}): ThreadSummary {
  return {
    thread: buildThreadConversation({ following: true }),
    author: buildUser({ id: 2 }),
    bodyExcerpt: 'the body',
    replyCount: 2,
    lastReplyAt: '2025-06-02T10:00:00Z',
    unread: false,
    ...overrides
  }
}

describe('ThreadsState', () => {
  beforeEach(() => {
    threadsState.clear()
  })

  it('tracks inbox unread state', () => {
    threadsState.setInbox([
      buildSummary({ thread: buildThreadConversation({ id: 40 }), unread: true }),
      buildSummary({ thread: buildThreadConversation({ id: 41 }), unread: false })
    ])

    expect(threadsState.unreadCount).toBe(1)
    expect(threadsState.isUnread(40)).toBe(true)
    expect(threadsState.isFollowing(41)).toBe(true)
    expect(threadsState.isFollowing(99)).toBe(false)
  })

  it('markUnread only applies to followed posts', () => {
    threadsState.setInbox([buildSummary({ thread: buildThreadConversation({ id: 40 }) })])

    threadsState.markUnread(40)
    threadsState.markUnread(99)

    expect(threadsState.isUnread(40)).toBe(true)
    expect(threadsState.isUnread(99)).toBe(false)
    expect(threadsState.unreadCount).toBe(1)
  })

  it('markRead clears unread in inbox and channel post lists', () => {
    const post = buildSummary({ thread: buildThreadConversation({ id: 40 }), unread: true })
    threadsState.setInbox([post])
    threadsState.setChannelPosts(20, [post])

    threadsState.markRead(40)

    expect(threadsState.isUnread(40)).toBe(false)
    expect(threadsState.inbox[0].unread).toBe(false)
    expect(threadsState.postsForChannel(20)![0].unread).toBe(false)
  })

  it('noteReply bumps counts everywhere and reorders by recency', () => {
    threadsState.setChannelPosts(20, [
      buildSummary({
        thread: buildThreadConversation({ id: 40 }),
        lastReplyAt: '2025-06-01T10:00:00Z'
      }),
      buildSummary({
        thread: buildThreadConversation({ id: 41 }),
        lastReplyAt: '2025-06-03T10:00:00Z'
      })
    ])

    threadsState.noteReply(40, '2025-06-04T10:00:00Z')

    const posts = threadsState.postsForChannel(20)!
    expect(posts[0].thread.id).toBe(40)
    expect(posts[0].replyCount).toBe(3)
  })

  it('setPostFollowing flips the flag on the channel post list', () => {
    threadsState.setChannelPosts(20, [
      buildSummary({ thread: buildThreadConversation({ id: 40, following: false }) })
    ])

    threadsState.setPostFollowing(20, 40, true)

    expect(threadsState.postsForChannel(20)![0].thread.following).toBe(true)
  })

  it('removeFromInbox drops the post from inbox and unread set', () => {
    threadsState.setInbox([
      buildSummary({ thread: buildThreadConversation({ id: 40 }), unread: true })
    ])

    threadsState.removeFromInbox(40)

    expect(threadsState.inbox).toHaveLength(0)
    expect(threadsState.unreadCount).toBe(0)
  })
})
