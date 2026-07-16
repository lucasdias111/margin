import type { ConversationMessagesResponse } from '$src/interfaces/Messages'
import type { ThreadConversation } from '$src/interfaces/Conversation'
import type { Channel } from '$src/interfaces/Channel'
import type { ThreadSummary } from '$src/interfaces/Thread'
import { View } from '$src/interfaces/View'
import { authenticatedDelete, authenticatedGet, authenticatedPost } from '$src/services/api'
import { messageLoaderService } from '$src/services/MessageLoaderService'
import { channelService } from '$src/services/ChannelService'
import { marginService } from '$src/services/MarginService'
import { navigationService } from '$src/services/NavigationService'
import { navigationState } from '$src/states/NavigationState.svelte'
import { conversationsState, defaultMeta } from '$src/states/ConversationsState.svelte.js'
import { threadsState } from '$src/states/ThreadsState.svelte'

class ThreadService {
  private static readonly PAGE_SIZE = 30

  async createPost(channel: Channel, title: string, body: string): Promise<ThreadConversation | null> {
    const response = await authenticatedPost({ title, body }, `channels/${channel.id}/threads`)
    if (!response.ok) return null
    const thread: ThreadConversation = await response.json()
    conversationsState.byId.set(thread.id, thread)
    await this.loadPostsForChannel(channel)
    return thread
  }

  async loadPostsForChannel(channel: Channel): Promise<void> {
    const response = await authenticatedGet(`channels/${channel.id}/threads`)
    if (!response.ok) return
    const posts: ThreadSummary[] = await response.json()
    for (const post of posts) {
      conversationsState.byId.set(post.thread.id, post.thread)
    }
    threadsState.setChannelPosts(channel.conversationId, posts)
  }

  openThread(thread: ThreadConversation): void {
    conversationsState.byId.set(thread.id, thread)
    navigationState.selectedThread = thread
    void this.loadThreadMessages(thread)
  }

  closeThread(): void {
    navigationState.selectedThread = null
  }

  async getThread(threadConversationId: number): Promise<ThreadConversation | null> {
    const response = await authenticatedGet(`threads/${threadConversationId}`)
    if (!response.ok) return null
    return response.json()
  }

  async loadThreadMessages(thread: ThreadConversation, force = false): Promise<void> {
    const meta = conversationsState.conversationMetaById.get(thread.id)
    if (!force && meta?.initialFetchCompleted && !meta?.isLoading) {
      if (document.hasFocus()) await this.markThreadAsRead(thread.id)
      return
    }

    conversationsState.conversationMetaById.set(thread.id, {
      ...(conversationsState.conversationMetaById.get(thread.id) ?? defaultMeta()),
      isLoading: true
    })

    const response = await authenticatedGet(
      `conversations/${thread.id}/messages?limit=${ThreadService.PAGE_SIZE}`
    )
    if (!response.ok) return

    const messageResponse: ConversationMessagesResponse = await response.json()
    conversationsState.messagesByConversationId.set(thread.id, messageResponse.messages)
    conversationsState.conversationMetaById.set(thread.id, {
      ...(conversationsState.conversationMetaById.get(thread.id) ?? defaultMeta()),
      isLoading: false,
      hasMore: messageResponse.messages.length >= ThreadService.PAGE_SIZE,
      initialFetchCompleted: true
    })

    if (document.hasFocus()) await this.markThreadAsRead(thread.id)
  }

  async markThreadAsRead(threadConversationId: number): Promise<void> {
    threadsState.markRead(threadConversationId)
    await messageLoaderService.markConversationAsRead(threadConversationId)
  }

  async followThread(thread: ThreadConversation): Promise<void> {
    const response = await authenticatedPost(null, `threads/${thread.id}/follow`)
    if (!response.ok) return
    this.setFollowing(thread, true)
    await this.loadInbox()
  }

  async unfollowThread(thread: ThreadConversation): Promise<void> {
    const response = await authenticatedDelete(null, `threads/${thread.id}/follow`)
    if (!response.ok) return
    this.setFollowing(thread, false)
    threadsState.removeFromInbox(thread.id)
  }

  private setFollowing(thread: ThreadConversation, following: boolean): void {
    const updated = { ...thread, following }
    conversationsState.byId.set(thread.id, updated)
    threadsState.setPostFollowing(thread.parentConversationId, thread.id, following)
    if (navigationState.selectedThread?.id === thread.id) {
      navigationState.selectedThread = updated
    }
  }

  async loadInbox(): Promise<void> {
    const response = await authenticatedGet('threads')
    if (!response.ok) return
    const summaries: ThreadSummary[] = await response.json()
    for (const summary of summaries) {
      conversationsState.byId.set(summary.thread.id, summary.thread)
    }
    threadsState.setInbox(summaries)
  }

  async navigateToThread(thread: ThreadConversation): Promise<void> {
    if (!thread.marginId || !thread.channelId) return
    conversationsState.byId.set(thread.id, thread)

    marginService.select(await marginService.getMargin(thread.marginId))
    navigationService.setView(View.Margin)
    try {
      const channel = await channelService.getChannelById(thread.channelId)
      channelService.select(channel)
      await this.loadPostsForChannel(channel)
    } catch {
      return
    }

    navigationState.selectedThread = thread
    await this.loadThreadMessages(thread)
  }

  async navigateToThreadById(threadConversationId: number): Promise<void> {
    const thread = await this.getThread(threadConversationId)
    if (!thread) return
    await this.navigateToThread(thread)
  }
}

export const threadService = new ThreadService()
