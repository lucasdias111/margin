<script lang="ts">
  import { chatState } from '$src/states/ChatState.svelte'
  import type { Space } from '$src/interfaces/Space'
  import ChatInput from '$src/components/chat/ChatInput.svelte'
  import MessagesContainer from '$src/components/chat/MessagesContainer.svelte'
  import { chatService } from '$src/services/ChatService'
  import type { SpaceMessage } from '$src/interfaces/Messages'
  import { userState } from '$src/states/UserState.svelte'
  import type { Channel } from '$src/interfaces/Channel'

  let selectedChannel = $state<Space | null>(null)
  let messages = $state<SpaceMessage[]>([])
  let messageInput = $state('')
  let messagesContainer = $state<HTMLDivElement>()

  $effect(() => {
    if (chatState.selectedChannel) {
      loadChannel(chatState.selectedChannel)
    }
  })

  function loadChannel(channel: Channel): void {
    selectedChannel = channel
  }

  function handleSubmit(): void {
    chatService.sendSpaceMessage(userState.currentUser, selectedChannel.id, messageInput)
  }
</script>

<div class="chat">
  {#if selectedChannel}
    <h1>{selectedChannel.name}</h1>
  {:else}
    <h1>No Channel selected</h1>
  {/if}

  <MessagesContainer {messages} bind:messagesContainer />
  <ChatInput selectedContent={!!selectedChannel} bind:messageInput onSubmit={handleSubmit} />
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
