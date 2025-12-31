<script lang="ts">
  import { chatState } from '$src/states/ChatState.svelte'
  import type { Space } from '$src/interfaces/Space'
  import ChatInput from '$src/components/chat/ChatInput.svelte'
  import MessagesContainer from '$src/components/chat/MessagesContainer.svelte'
  import { chatService } from '$src/services/ChatService'
  import type { SpaceMessage } from '$src/interfaces/Messages'

  let selectedSpace = $state<Space | null>(null)
  let messages = $state<SpaceMessage[]>([])
  let messageInput = $state('')
  let messagesContainer = $state<HTMLDivElement>()

  $effect(() => {
    if (chatState.selectedSpace) {
      loadSpace(chatState.selectedSpace)
    }
  })

  function loadSpace(space: Space): void {
    selectedSpace = space
  }

  function handleSubmit(): void {
    chatService.getSpaces()
  }
</script>

<div class="chat">
  {#if selectedSpace}
    <h1>{selectedSpace.name}</h1>
  {:else}
    <h1>No Space selected</h1>
  {/if}

  <MessagesContainer {messages} bind:messagesContainer />
  <ChatInput selectedContent={!!selectedSpace} bind:messageInput onSubmit={handleSubmit} />
</div>

<style>
  .chat {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  h1 {
    text-align: center;
  }
</style>
