<script lang="ts">
  import ChannelChatHeader from '$src/components/content/chat/channel/ChannelChatHeader.svelte'
  import ThreadPostView from '$src/components/content/chat/thread/ThreadPostView.svelte'
  import NewPostModal from '$src/components/content/chat/thread/NewPostModal.svelte'
  import UserAvatar from '$src/components/common/user/UserAvatar.svelte'
  import Icon from '$src/components/common/icons/Icon.svelte'
  import { channelService } from '$src/services/ChannelService'
  import { threadService } from '$src/services/ThreadService'
  import { navigationState } from '$src/states/NavigationState.svelte'
  import { threadsState } from '$src/states/ThreadsState.svelte'
  import { formatTimestamp } from '$src/utils/DateUtils'
  import type { ThreadSummary } from '$src/interfaces/Thread'
  import { untrack } from 'svelte'

  let newPostOpen = $state(false)

  const channel = $derived(navigationState.selectedChannel)
  const posts = $derived(channel ? threadsState.postsForChannel(channel.conversationId) : undefined)
  const openThread = $derived(navigationState.selectedThread)

  $effect(() => {
    const current = channel
    if (current) {
      untrack(() => {
        threadService.loadPostsForChannel(current)
      })
    }
  })

  function openPost(post: ThreadSummary): void {
    threadService.openThread(post.thread)
  }

  async function submitPost(title: string, body: string): Promise<void> {
    if (!channel) return
    const thread = await threadService.createPost(channel, title, body)
    newPostOpen = false
    if (thread) threadService.openThread(thread)
  }
</script>

<div class="thread-channel">
  {#if channel}
    <ChannelChatHeader
      name={channel.name}
      description={channel.description}
      onBack={() => channelService.select(null)}
    />
  {/if}

  {#if openThread && openThread.parentConversationId === channel?.conversationId}
    <ThreadPostView thread={openThread} onClose={() => threadService.closeThread()} />
  {:else}
    <div class="pane post-pane">
      <div class="post-toolbar">
        <span class="post-count">
          {posts ? `${posts.length} ${posts.length === 1 ? 'post' : 'posts'}` : ''}
        </span>
        <button type="button" class="new-post-btn" onclick={() => (newPostOpen = true)}>
          <Icon name="plus" size={14} />
          New post
        </button>
      </div>

      {#if !posts}
        <div class="empty-state">Loading…</div>
      {:else if posts.length === 0}
        <div class="empty-state">
          <Icon name="messages" size={40} strokeWidth={1.5} color="#ddd" />
          <span>No posts yet — start the first one</span>
        </div>
      {:else}
        <div class="post-list">
          {#each posts as post (post.thread.id)}
            <button
              type="button"
              class="post-item"
              class:unread={post.unread || threadsState.isUnread(post.thread.id)}
              onclick={() => openPost(post)}
            >
              <div class="post-avatar">
                {#if post.author}
                  <UserAvatar
                    profilePictureUrl={post.author.profilePictureUrl}
                    width={36}
                    height={36}
                  />
                {:else}
                  <Icon name="messages" size={18} />
                {/if}
              </div>
              <div class="post-body">
                <div class="post-title">{post.thread.title}</div>
                <div class="post-excerpt">{post.bodyExcerpt ?? ''}</div>
                <div class="post-meta">
                  <span class="post-author">{post.author?.displayName ?? 'Unknown'}</span>
                  <span class="post-replies">
                    {post.replyCount}
                    {post.replyCount === 1 ? 'reply' : 'replies'}
                  </span>
                  {#if post.lastReplyAt}
                    <span class="post-date">{formatTimestamp(post.lastReplyAt)}</span>
                  {/if}
                </div>
              </div>
              {#if post.unread || threadsState.isUnread(post.thread.id)}
                <div class="unread-dot"></div>
              {/if}
            </button>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>

<NewPostModal open={newPostOpen} onClose={() => (newPostOpen = false)} onSubmit={submitPost} />

<style>
  .thread-channel {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    gap: 10px;
    width: 100%;
  }

  .post-pane {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow-y: auto;
    padding: 16px 20px;
  }

  .post-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
  }

  .post-count {
    font-size: 12px;
    font-weight: 600;
    color: #aaa;
    letter-spacing: 0.03em;
    text-transform: uppercase;
  }

  .new-post-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    background: #ff843c;
    color: white;
    border: none;
    border-radius: 10px;
    padding: 8px 14px;
    font-family: inherit;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.12s;
  }

  .new-post-btn:hover {
    background: #e8712a;
  }

  .new-post-btn :global(svg) {
    color: white;
  }

  .post-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .post-item {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 16px;
    border-radius: 12px;
    background: #f7f7fa;
    border: none;
    cursor: pointer;
    text-align: left;
    transition: background 0.15s;
    width: 100%;
    font-family: inherit;
  }

  .post-item:hover {
    background: #f0f0f5;
  }

  .post-item.unread {
    background: #fff4ee;
  }

  .post-item.unread:hover {
    background: #ffe8d6;
  }

  .post-avatar {
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
    border-radius: 10px;
    color: #ff843c;
    overflow: hidden;
  }

  .post-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }

  .post-title {
    font-size: 14px;
    font-weight: 700;
    color: #1a1a1a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .post-excerpt {
    font-size: 12px;
    color: #666;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .post-meta {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .post-author {
    font-size: 11px;
    font-weight: 600;
    color: #888;
  }

  .post-replies {
    font-size: 11px;
    font-weight: 600;
    color: #e8712a;
  }

  .post-date {
    font-size: 11px;
    color: #bbb;
  }

  .unread-dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: #ff843c;
    flex-shrink: 0;
  }

  .empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    color: #ccc;
    font-size: 13px;
  }
</style>
