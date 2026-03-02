<script lang="ts">
  import type { Message } from '$src/interfaces/Messages'
  import { tick } from 'svelte'
  import DirectMessageBubble from '../../chat/private/DirectMessageBubble.svelte'
  import ChannelMessageBubble from '$src/components/chat/channel/ChannelMessageBubble.svelte'
  import { userState } from '$src/states/UserState.svelte.js'

  let {
    messages,
    isLoading = false,
    messagesContainer = $bindable()
  }: {
    messages: (Message | undefined)[]
    isLoading?: boolean
    messagesContainer?: HTMLDivElement
    isDirectMessage?: boolean
  } = $props()

  function scrollToBottom(): void {
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight
    }
  }

  $effect(() => {
    void messages.length
    if (isLoading) return
    tick().then(scrollToBottom)
  })
</script>

<div class="messages-wrapper" bind:this={messagesContainer}>
  {#if isLoading}
    <div class="loading">
      <div class="spinner"></div>
    </div>
  {:else}
    <div class="messages">
      {#each messages as message (message.id)}
        <div class="messages-container" class:sent={message.user.id === userState.currentUser?.id}>
          {#if message.conversationType === 'DIRECT'}
            <DirectMessageBubble {message} />
          {:else}
            <ChannelMessageBubble {message} />
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .messages-wrapper {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }

  .messages {
    padding: 20px;
    scroll-behavior: smooth;
    display: flex;
    flex-direction: column;
    gap: 8px;
    box-sizing: border-box;
  }

  .messages-container {
    display: flex;
    justify-content: flex-start;
    width: 100%;
  }

  .messages-container.sent {
    justify-content: flex-end;
  }

  .loading {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 40px 0;
  }

  .spinner {
    width: 28px;
    height: 28px;
    border: 3px solid rgba(218, 107, 16, 0.2);
    border-top-color: #da6b10;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
