<script lang="ts">
  import { userState } from '$src/states/UserState.svelte.js'
  import { formatTimestamp } from '$src/utils/DateUtils'
  import UserAvatar from '$src/components/common/user/UserAvatar.svelte'
  import type { Message } from '$src/interfaces/Messages'

  interface Props {
    message: Message
    showReadStatus?: boolean
  }

  let {
    message,
    showReadStatus = false
  }: Props = $props()

  let isSent = $derived(message.user.id === userState.currentUser?.id)
</script>

<div class="wrapper" class:sent={isSent}>
  {#if !isSent}
    <div class="avatar">
      <UserAvatar profilePictureUrl={message.user.profilePictureUrl} width={32} height={32} />
    </div>
  {/if}

  <div class="bubble" class:sent={isSent}>
    {#if message.conversationType === 'CHANNEL' && message.user.id !== userState.currentUser?.id}
      <span class="username">{message.user.username}</span>
    {/if}
    <p class="text">{message.content}</p>
    <div class="meta">
      {#if message.isEdited}
        <span class="edited">edited</span>
      {/if}
      <span class="timestamp">{formatTimestamp(message.createdAt)}</span>
      {#if showReadStatus && isSent}
        <span class="checkmark">✓✓</span>
      {/if}
    </div>
  </div>
</div>

<style>
  .wrapper {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    width: 100%;
    justify-content: flex-start;
  }

  .wrapper.sent {
    justify-content: flex-end;
  }

  .avatar {
    flex-shrink: 0;
    margin-bottom: 2px;
  }

  .bubble {
    position: relative;
    padding: 10px 14px 8px;
    border-radius: 20px;
    max-width: 60%;
    width: fit-content;
    display: flex;
    flex-direction: column;
    gap: 2px;
    word-break: break-word;
    line-height: 1.45;
    font-size: 14px;
  }

  .bubble:not(.sent) {
    background-color: #f5ecd5;
    color: #2d2d2d;
    border-bottom-left-radius: 4px;
  }

  .bubble.sent {
    background-color: #f47e3a;
    color: #2d2d2d;
    border-bottom-right-radius: 4px;
  }

  .username {
    font-size: 12px;
    font-weight: 700;
    color: #f47e3a;
    letter-spacing: 0.01em;
    margin-bottom: 2px;
  }

  .text {
    margin: 0;
    white-space: pre-wrap;
  }

  .meta {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 3px;
    font-size: 10px;
    opacity: 0.55;
    align-self: flex-end;
  }

  .bubble.sent .checkmark {
    opacity: 1;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.9);
  }

  .edited {
    font-style: italic;
  }
</style>
