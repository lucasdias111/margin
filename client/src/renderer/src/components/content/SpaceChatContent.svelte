<script lang="ts">
  import { chatState } from '$src/states/ChatState.svelte'
  import ChatInput from '$src/components/chat/ChatInput.svelte'
  import MessagesContainer from '$src/components/chat/MessagesContainer.svelte'
  import { chatService } from '$src/services/ChatService'
  import type { ChannelMessage } from '$src/interfaces/Messages'
  import { userState } from '$src/states/UserState.svelte'
  import type { Channel } from '$src/interfaces/Channel'
  import { onDestroy, onMount } from 'svelte'
  import { webSocketService } from '$src/services/WebSocketService'
  import { WebSocketMessageType } from '$src/interfaces/WebSocketMessageType'
  import type { WebSocketMessage } from '$src/interfaces/WebSocketMessages'
  import { authenticatedGet } from '$src/services/api'
  import ChatHeader from '$src/components/content/ChatHeader.svelte'

  let selectedChannel = $state<Channel | null>(null)
  let messages = $state<ChannelMessage[]>([])
  let messageInput = $state('')
  let messagesContainer = $state<HTMLDivElement>()

  $effect(() => {
    if (chatState.selectedChannel) {
      loadChannel(chatState.selectedChannel)
    }
  })

  onMount(() => {
    webSocketService.on(WebSocketMessageType.RECEIVE_CHANNEL_MESSAGE, handleIncomingChannelMessage)
  })

  onDestroy(() => {
    webSocketService.off(WebSocketMessageType.RECEIVE_CHANNEL_MESSAGE, handleIncomingChannelMessage)
  })

  async function handleIncomingChannelMessage(
    incomingMsg: WebSocketMessage<ChannelMessage>
  ): Promise<void> {
    if (selectedChannel && incomingMsg.payload.channelId === selectedChannel.id) {
      messages = [...messages, incomingMsg.payload]
    }
  }

  function loadChannel(channel: Channel): void {
    selectedChannel = channel
    loadMesagesForChannel(selectedChannel.id)
  }

  async function handleSubmit(event?: Event): Promise<void> {
    if (event) {
      event.preventDefault()
    }

    const newMessage: ChannelMessage = await chatService.sendChannelMessage(
      userState.currentUser,
      selectedChannel,
      messageInput
    )

    if (newMessage) {
      newMessage.message = messageInput
      messages = [...messages, newMessage]
      messageInput = ''
    }
  }

  async function loadMesagesForChannel(channelId: number): Promise<void> {
    const response = await authenticatedGet(`chat_messages/${channelId}/get_messages_for_channel`)

    if (!response.ok) {
      throw new Error(`Request failed with status: ${response.status}`)
    }

    messages = await response.json()

    messagesContainer.scrollTop = messagesContainer.scrollHeight
  }

  function handleVoiceCall(): void {
    console.log('Not yet implemented')
  }

  function handleVideoCall(): void {
    console.log('Not yet implemented')
  }

</script>

<div class="chat">
  {#if selectedChannel}
    <ChatHeader
      name={selectedChannel.name}
      handleStartCall={handleVoiceCall}
      handleStartVideoCall={handleVideoCall}
    />
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
