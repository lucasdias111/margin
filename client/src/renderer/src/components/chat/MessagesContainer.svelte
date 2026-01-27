<script lang="ts">
  import type { BaseMessage, DirectMessage } from '$src/interfaces/Messages'
  import { userState } from '$src/states/UserState.svelte'
  import { tick } from 'svelte'

  let {
    messages,
    messagesContainer = $bindable(),
    isDirectMessage = false
  }: {
    messages: BaseMessage[]
    messagesContainer?: HTMLDivElement
    isDirectMessage?: boolean
  } = $props()

  function scrollToBottom(): void {
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight
    }
  }

  function formatTimestamp(date: Date | string): string {
    const messageDate = new Date(date)

    return messageDate.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  function isDirectMessageType(message: BaseMessage): message is DirectMessage {
    return 'isRead' in message
  }

  $effect(() => {
    messages
    tick().then(scrollToBottom)
  })
</script>

<div>
  <div class="messages" bind:this={messagesContainer}>
    {#each messages as message}
      <div class="message" class:sent={message.fromUserId === userState.currentUser?.id}>
        <div class="message-content">
          <p class="userNameMessageReceived">{userState.currentUser.username}:</p> {message.message}
        </div>
        <div class="message-meta">
          <span class="timestamp">{formatTimestamp(message.createdAt)}</span>
          {#if isDirectMessageType(message) && message.isEdited}
            <span class="edited">edited</span>
          {/if}
          {#if isDirectMessage && message.fromUserId === userState.currentUser?.id && isDirectMessageType(message) && message.isRead}
            <span class="read-status">read</span>
          {/if}
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .messages {
    height: calc(100vh - 300px);
    padding: 20px;
    overflow-y: auto;
    scroll-behavior: smooth;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .userNameMessageReceived {
    color: darkslategrey
  }

  .message {
    padding: 12px 16px;
    border-radius: 18px;
    max-width: 60%;
    word-wrap: break-word;
    width: fit-content;
    display: flex;
    flex-direction: column;
    font-size: 14px;
    gap: 4px;
  }

  .message:not(.sent) {
    background-color: #b47024;
    align-self: flex-start;
    border-bottom-left-radius: 4px;
  }

  .message.sent {
    background-color: #69685f;
    color: #e5e5e5;
    align-self: flex-end;
    border-bottom-right-radius: 4px;
  }

  .message-content {
    line-height: 1.4;
  }

  .message-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 9px;
    opacity: 0.4;
    margin-top: 2px;
  }

  .timestamp {
    font-weight: 500;
  }

  .edited,
  .read-status {
    font-style: italic;
    font-size: 10px;
  }
</style>
