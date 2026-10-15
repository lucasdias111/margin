import type { ThreadSummary } from '$src/interfaces/Thread'
import { SvelteMap, SvelteSet } from 'svelte/reactivity'

class ThreadsState {
  private _inboxByThreadId = new SvelteMap<number, ThreadSummary>()
  private _postsByChannelConversationId = new SvelteMap<number, ThreadSummary[]>()
  private _unreadThreadIds = new SvelteSet<number>()
  private _inboxLoaded = $state(false)

  get inboxLoaded(): boolean {
    return this._inboxLoaded
  }

  get inbox(): ThreadSummary[] {
    return [...this._inboxByThreadId.values()].sort(byMostRecent)
  }

  get unreadCount(): number {
    return this._unreadThreadIds.size
  }

  postsForChannel(channelConversationId: number): ThreadSummary[] | undefined {
    return this._postsByChannelConversationId.get(channelConversationId)
  }

  setChannelPosts(channelConversationId: number, posts: ThreadSummary[]): void {
    this._postsByChannelConversationId.set(channelConversationId, [...posts].sort(byMostRecent))
    for (const post of posts) {
      if (post.unread) this._unreadThreadIds.add(post.thread.id)
    }
  }

  setInbox(summaries: ThreadSummary[]): void {
    this._inboxByThreadId.clear()
    this._unreadThreadIds.clear()
    for (const summary of summaries) {
      this._inboxByThreadId.set(summary.thread.id, summary)
      if (summary.unread) this._unreadThreadIds.add(summary.thread.id)
    }
    this._inboxLoaded = true
  }

  isFollowing(threadConversationId: number): boolean {
    return this._inboxByThreadId.has(threadConversationId)
  }

  isUnread(threadConversationId: number): boolean {
    return this._unreadThreadIds.has(threadConversationId)
  }

  markUnread(threadConversationId: number): void {
    if (this._inboxByThreadId.has(threadConversationId)) {
      this._unreadThreadIds.add(threadConversationId)
    }
    this.updateEverywhere(threadConversationId, (s) => ({ ...s, unread: true }))
  }

  markRead(threadConversationId: number): void {
    this._unreadThreadIds.delete(threadConversationId)
    this.updateEverywhere(threadConversationId, (s) => (s.unread ? { ...s, unread: false } : s))
  }

  noteReply(threadConversationId: number, lastReplyAt: string): void {
    this.updateEverywhere(threadConversationId, (s) => ({
      ...s,
      replyCount: s.replyCount + 1,
      lastReplyAt
    }))
  }

  setPostFollowing(
    channelConversationId: number,
    threadConversationId: number,
    following: boolean
  ): void {
    const posts = this._postsByChannelConversationId.get(channelConversationId)
    if (!posts) return
    this._postsByChannelConversationId.set(
      channelConversationId,
      posts.map((p) =>
        p.thread.id === threadConversationId ? { ...p, thread: { ...p.thread, following } } : p
      )
    )
  }

  removeFromInbox(threadConversationId: number): void {
    this._inboxByThreadId.delete(threadConversationId)
    this._unreadThreadIds.delete(threadConversationId)
  }

  clear(): void {
    this._inboxByThreadId.clear()
    this._postsByChannelConversationId.clear()
    this._unreadThreadIds.clear()
    this._inboxLoaded = false
  }

  private updateEverywhere(
    threadConversationId: number,
    update: (summary: ThreadSummary) => ThreadSummary
  ): void {
    const inInbox = this._inboxByThreadId.get(threadConversationId)
    if (inInbox) this._inboxByThreadId.set(threadConversationId, update(inInbox))

    for (const [channelConvId, posts] of this._postsByChannelConversationId) {
      if (!posts.some((p) => p.thread.id === threadConversationId)) continue
      this._postsByChannelConversationId.set(
        channelConvId,
        posts.map((p) => (p.thread.id === threadConversationId ? update(p) : p)).sort(byMostRecent)
      )
    }
  }
}

function byMostRecent(a: ThreadSummary, b: ThreadSummary): number {
  const aTime = a.lastReplyAt ?? a.thread.createdAt
  const bTime = b.lastReplyAt ?? b.thread.createdAt
  return new Date(bTime).getTime() - new Date(aTime).getTime()
}

export const threadsState = new ThreadsState()
