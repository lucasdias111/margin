<script lang="ts">
  import type { Message } from '$src/interfaces/Messages'
  import { tick } from 'svelte'
  import DirectMessageBubble from './DirectMessageBubble.svelte'
  import ChannelMessageBubble from '$src/components/chat/ChannelMessageBubble.svelte'
  import { userState } from '$src/states/UserState.svelte'

  let {
    messages,
    messagesContainer = $bindable()
  }: {
    messages: (Message | undefined)[]
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
    tick().then(scrollToBottom)
  })
</script>

<div>
  <div class="messages" bind:this={messagesContainer}>
    {#each messages as message (message.id)}
      <div class="message-container" class:sent={message.fromUserId === userState.currentUser?.id}>
        {#if message.conversationType === 'DIRECT'}
          <DirectMessageBubble {message} />
        {:else}
          <ChannelMessageBubble {message} />
        {/if}
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

  .message-container {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }

  .message-container:not(.sent) {
    justify-content: flex-start;
  }

  .message-container.sent {
    justify-content: flex-end;
  }
</style>
