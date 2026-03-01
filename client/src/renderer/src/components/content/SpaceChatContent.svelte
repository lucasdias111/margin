<script lang="ts">
  import { chatState } from '$src/states/ChatState.svelte'
  import ChatInput from '$src/components/chat/ChatInput.svelte'
  import MessagesContainer from '$src/components/chat/MessagesContainer.svelte'
  import { chatService } from '$src/services/ChatService'
  import { userState } from '$src/states/UserState.svelte'
  import type { Channel } from '$src/interfaces/Channel'
  import { onDestroy, onMount } from 'svelte'
  import { webSocketService } from '$src/services/WebSocketService'
  import { WebSocketMessageType } from '$src/interfaces/WebSocketMessageType'
  import type { WebSocketMessage } from '$src/interfaces/WebSocketMessages'
  import { authenticatedGet } from '$src/services/api'
  import ChatHeader from '$src/components/content/ChatHeader.svelte'
  import { callState } from '$src/states/CallState.svelte'
  import { channelCallService } from '$src/services/ChannelCallService'
  import type { ConversationMessagesResponse, Message } from '$src/interfaces/Messages'
  import ChannelSidebar from '$src/components/content/ChannelSidebar.svelte'

  let selectedChannel = $derived(chatState.selectedChannel)
  let messages = $state<Message[]>([])
  let messageInput = $state('')
  let messagesContainer = $state<HTMLDivElement>()
  let sidebarOpen = $state(true)

  let isInChannelCall = $derived(
    callState.isGroupCall && callState.groupCallState?.channelId === selectedChannel?.id
  )

  $effect(() => {
    if (chatState.selectedChannel) {
      loadChannel(chatState.selectedChannel)
    }
  })

  onMount(() => {
    webSocketService.on(WebSocketMessageType.RECEIVE_MESSAGE, handleIncomingChannelMessage)
  })

  onDestroy(() => {
    webSocketService.off(WebSocketMessageType.RECEIVE_MESSAGE, handleIncomingChannelMessage)
  })

  async function handleIncomingChannelMessage(
    incomingMsg: WebSocketMessage<Message>
  ): Promise<void> {
    if (selectedChannel && incomingMsg.payload.conversationId === selectedChannel.conversationId) {
      messages = [...messages, incomingMsg.payload]
    }
  }

  function loadChannel(channel: Channel): void {
    selectedChannel = channel
    loadMessagesForChannel(selectedChannel)
  }

  async function handleSubmit(event?: Event): Promise<void> {
    if (event) {
      event.preventDefault()
    }

    await chatService.sendChannelMessage(userState.currentUser, selectedChannel, messageInput)
  }

  async function loadMessagesForChannel(channel: Channel): Promise<void> {
    const response = await authenticatedGet(`api/conversations/${channel.id}/channel_messages`)

    if (!response.ok) {
      throw new Error(`Request failed with status: ${response.status}`)
    }

    const messageResponse: ConversationMessagesResponse = await response.json()
    messages = messageResponse.messages

    messagesContainer.scrollTop = messagesContainer.scrollHeight

    await chatService.markConversationAsRead(channel.conversationId)
  }

  function handleVoiceCall(): void {
    if (isInChannelCall) {
      channelCallService.endChannelCall()
    } else {
      channelCallService.joinVoiceChannel(selectedChannel.id)
    }
  }

  function handleVideoCall(): void {
    console.log('Not yet implemented')
  }

  function toggleSidebar(): void {
    sidebarOpen = !sidebarOpen
  }
</script>

<div class="chat">
  {#if selectedChannel}
    <ChatHeader
      name={selectedChannel.name}
      handleStartCall={handleVoiceCall}
      handleStartVideoCall={handleVideoCall}
      isInCall={isInChannelCall}
      onToggleSidebar={toggleSidebar}
      {sidebarOpen}
    />
  {/if}

  <div class="chat-body">
    <div class="chat-background">
      <MessagesContainer {messages} bind:messagesContainer />
    </div>

    <ChannelSidebar channel={selectedChannel} bind:isOpen={sidebarOpen} />
  </div>

  <ChatInput selectedContent={!!selectedChannel} bind:messageInput onSubmit={handleSubmit} />
</div>

<style>
  .chat {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    gap: 10px;
    width: 100%;
    z-index: 999;
  }

  .chat-body {
    flex: 1;
    display: flex;
    min-height: 0;
    gap: 10px;
    overflow: hidden;
    align-items: stretch;
  }

  .chat-background {
    flex: 1;
    z-index: 1;
    background-color: white;
    border-radius: 15px;
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
</style>
