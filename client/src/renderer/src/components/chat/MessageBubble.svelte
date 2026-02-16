<script lang="ts">
  import { userState } from '$src/states/UserState.svelte'
  import { formatTimestamp } from '$src/components/chat/ChatMessageUtils.svelte'

  interface Props {
    fromUserId: number
    createdAt: string
    message: string
    isEdited?: boolean
    showReadStatus?: boolean
    username?: string
  }

  let {
    fromUserId,
    createdAt,
    message,
    isEdited = false,
    showReadStatus = false,
    username
  }: Props = $props()

  let isSent = $derived(fromUserId === userState.currentUser?.id)
</script>

<div class="message" class:sent={isSent}>
  <div class="message-content">
    {#if username}
      <p class="username">{username}:</p>
    {/if}
    {message}
  </div>
  <div class="message-meta">
    <span class="timestamp">{formatTimestamp(createdAt)}</span>
    {#if isEdited}
      <span class="edited">edited</span>
    {/if}
    {#if showReadStatus && isSent}
      <span class="read-status">read</span>
    {/if}
  </div>
</div>

<style>
  .message {
    padding: 8px 16px;
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
    border-bottom-left-radius: 4px;
  }

  .message.sent {
    background-color: #69685f;
    color: #e5e5e5;
    border-bottom-right-radius: 4px;
  }

  .message-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 9px;
    opacity: 0.6;
    margin-top: 2px;
  }

  .edited,
  .read-status {
    font-style: italic;
    font-size: 10px;
  }

  .username {
    color: #0f0f0f;
    margin: 6px 0;
  }
</style>
