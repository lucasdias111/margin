<script lang="ts">
  import { chatState } from '$src/states/ChatState.svelte'
  import ChatInput from '$src/components/chat/ChatInput.svelte'
  import MessagesContainer from '$src/components/chat/MessagesContainer.svelte'
  import { chatService } from '$src/services/ChatService'
  import type { ChannelMessage } from '$src/interfaces/Messages'
  import { userState } from '$src/states/UserState.svelte'
  import type { Channel } from '$src/interfaces/Channel'
  import { onMount } from 'svelte'
  import { webSocketService } from '$src/services/WebSocketService'
  import { WebSocketMessageType } from '$src/interfaces/WebSocketMessageType'
  import type { WebSocketMessage } from '$src/interfaces/WebSocketMessage'
  import { authenticatedGet } from '$src/services/api'

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

  async function handleIncomingChannelMessage(data: WebSocketMessage): Promise<void> {
    console.log('Incoming message data:', data)

    const incomingMsg: ChannelMessage = JSON.parse(data.payload)

    console.log('Selected channel: ' + selectedChannel)
    console.log('Incoming channel id: ' + incomingMsg.channelId)

    if (selectedChannel && incomingMsg.channelId === selectedChannel.id) {
      messages = [...messages, incomingMsg]
    } else {
      console.log("Message not added - sender doesn't match selected channel")
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
      selectedChannel.id,
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

    const loadedMessages: ChannelMessage[] = await response.json()

    messages = loadedMessages

    messagesContainer.scrollTop = messagesContainer.scrollHeight
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
