<script lang="ts">
  import { chatState } from '$src/states/ChatState.svelte.js'
  import { conversationState } from '$src/states/ConversationState.svelte.js'
  import ChatInput from '$src/components/common/chat/ChatInput.svelte'
  import MessagesContainer from '$src/components/common/chat/MessagesContainer.svelte'
  import { chatService } from '$src/services/ChatService'
  import { userState } from '$src/states/UserState.svelte.js'
  import ChannelSidebar from '$src/components/content/chat/channel/ChannelSidebar.svelte'
  import ChannelChatHeader from '$src/components/content/chat/channel/ChannelChatHeader.svelte'

  let messageInput = $state('')
  let sidebarOpen = $state(true)

  $effect(() => {
    if (chatState.selectedChannel) {
      chatService.loadMessagesForChannel(chatState.selectedChannel)
    }
  })

  async function handleSubmit(event?: Event): Promise<void> {
    if (event) event.preventDefault()
    if (!messageInput.trim()) return

    const messageContent = messageInput
    messageInput = ''

    await chatService.sendChannelMessage(
      userState.currentUser,
      chatState.selectedChannel,
      messageContent
    )
  }

  function onToggleSidebar(): void {
    sidebarOpen = !sidebarOpen
  }
</script>

<div class="chat">
  {#if chatState.selectedChannel}
    <ChannelChatHeader
      name={chatState.selectedChannel.name}
      description={chatState.selectedChannel.description}
      {onToggleSidebar}
      {sidebarOpen}
    />
  {/if}

  <div class="chat-body">
    <div class="chat-background">
      <MessagesContainer
        messages={conversationState.messages}
        isLoading={conversationState.isLoading}
      />
    </div>
    <ChannelSidebar channel={chatState.selectedChannel} bind:isOpen={sidebarOpen} />
  </div>

  <ChatInput
    selectedContent={!!chatState.selectedChannel}
    bind:messageInput
    onSubmit={handleSubmit}
  />
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
