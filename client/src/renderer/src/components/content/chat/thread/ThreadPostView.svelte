<script lang="ts">
  import type { ThreadConversation } from '$src/interfaces/Conversation'
  import ChatInput from '$src/components/common/chat/input/ChatInput.svelte'
  import MessagesContainer from '$src/components/common/chat/MessagesContainer.svelte'
  import Icon from '$src/components/common/icons/Icon.svelte'
  import { threadService } from '$src/services/ThreadService'
  import { messageSenderService } from '$src/services/MessageSenderService'
  import { typingIndicatorService } from '$src/services/TypingIndicatorService'
  import { typingIndicatorState } from '$src/states/TypingIndicatorState.svelte'
  import { conversationsState, defaultMeta } from '$src/states/ConversationsState.svelte'
  import { sessionState } from '$src/states/SessionState.svelte'
  import { untrack } from 'svelte'

  interface Props {
    thread: ThreadConversation
    onClose: () => void
  }

  let { thread, onClose }: Props = $props()

  let messageInput = $state('')

  const messages = $derived(conversationsState.messagesByConversationId.get(thread.id) ?? [])
  const meta = $derived(conversationsState.conversationMetaById.get(thread.id) ?? defaultMeta())
  const typingUsers = $derived(typingIndicatorState.byConversationId.get(thread.id) ?? [])

  $effect(() => {
    const id = thread.id
    untrack(() => {
      threadService.loadThreadMessages(thread)
    })
    return () => typingIndicatorService.stopTyping(id)
  })

  $effect(() => {
    const id = thread.id
    if (messageInput.length > 0) {
      typingIndicatorService.notifyTyping(id)
    } else {
      typingIndicatorService.stopTyping(id)
    }
  })

  async function handleSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault()
    if (!messageInput.trim() || !sessionState.currentUser) return
    const content = messageInput
    messageInput = ''
    await messageSenderService.sendThreadMessage(sessionState.currentUser, thread, content)
  }

  function toggleFollow(): void {
    if (thread.following) {
      threadService.unfollowThread(thread)
    } else {
      threadService.followThread(thread)
    }
  }
</script>

<svelte:window
  onfocus={() => {
    threadService.markThreadAsRead(thread.id)
  }}
/>

<div class="post-view pane">
  <div class="post-header">
    <button type="button" class="back-btn" aria-label="Back to posts" onclick={onClose}>
      <Icon name="chevronLeft" size={20} />
    </button>
    <div class="post-header-title">
      <span class="post-title">{thread.title}</span>
    </div>
    <button
      type="button"
      class="follow-btn"
      class:following={thread.following}
      onclick={toggleFollow}
    >
      {thread.following ? 'Following' : 'Follow'}
    </button>
  </div>

  <MessagesContainer
    {messages}
    isLoading={meta.isLoading}
    {typingUsers}
    conversation={thread}
    postStyle={true}
  />

  <ChatInput
    selectedContent={true}
    bind:messageInput
    onSubmit={handleSubmit}
    fileUploadEnabled={false}
  />
</div>

<style>
  .post-view {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
  }

  .post-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    flex-shrink: 0;
  }

  .back-btn {
    display: flex;
    align-items: center;
    background: none;
    border: none;
    padding: 4px;
    cursor: pointer;
    border-radius: 8px;
    color: #666;
  }

  .back-btn:hover {
    background: rgba(0, 0, 0, 0.05);
  }

  .post-header-title {
    flex: 1;
    min-width: 0;
  }

  .post-title {
    font-size: 15px;
    font-weight: 700;
    color: #1a1a1a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
  }

  .follow-btn {
    background: none;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 9px;
    padding: 5px 12px;
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    color: #666;
    cursor: pointer;
    transition:
      background 0.12s,
      color 0.12s;
  }

  .follow-btn:hover {
    background: rgba(0, 0, 0, 0.04);
  }

  .follow-btn.following {
    color: #e8712a;
    border-color: rgba(255, 132, 60, 0.4);
    background: rgba(255, 132, 60, 0.07);
  }
</style>
