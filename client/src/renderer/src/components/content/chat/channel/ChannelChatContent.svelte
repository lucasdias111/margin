<script lang="ts">
  import ChatInput from '$src/components/common/chat/ChatInput.svelte'
  import MessagesContainer from '$src/components/common/chat/MessagesContainer.svelte'
  import { chatService } from '$src/services/ChatService'
  import ChannelSidebar from '$src/components/content/chat/channel/ChannelSidebar.svelte'
  import ChannelChatHeader from '$src/components/content/chat/channel/ChannelChatHeader.svelte'
  import { navigationState } from '$src/states/NavigationState.svelte'
  import { sessionState } from '$src/states/SessionState.svelte'
  import { conversationsState, defaultMeta } from '$src/states/ConversationsState.svelte'

  let messageInput = $state('')
  let sidebarOpen = $state(true)

  const activeConvId = $derived(navigationState.selectedChannel?.conversationId)
  const activeMessages = $derived(
    activeConvId ? (conversationsState.messagesByConversationId.get(activeConvId) ?? []) : []
  )
  const activeMeta = $derived(
    activeConvId
      ? (conversationsState.conversationMetaById.get(activeConvId) ?? defaultMeta())
      : defaultMeta()
  )

  $effect(() => {
    if (navigationState.selectedChannel) {
      chatService.loadConversationForChannel(navigationState.selectedChannel)
    }
  })

  async function handleSubmit(event?: Event): Promise<void> {
    if (event) event.preventDefault()
    if (!messageInput.trim() || !navigationState.selectedChannel) return

    const messageContent = messageInput
    messageInput = ''

    const message = await chatService.sendChannelMessage(
      sessionState.currentUser,
      navigationState.selectedChannel,
      messageContent
    )

    conversationsState.appendMessage(message, false)
  }

  function onToggleSidebar(): void {
    sidebarOpen = !sidebarOpen
  }
</script>

<svelte:window
  onfocus={() => {
    if (activeConvId) {
      chatService.markConversationAsRead(activeConvId)
    }
  }}
/>

<div class="chat">
  {#if navigationState.selectedChannel}
    <ChannelChatHeader
      name={navigationState.selectedChannel.name}
      description={navigationState.selectedChannel.description}
      {onToggleSidebar}
      {sidebarOpen}
    />
  {/if}

  <div class="chat-body">
    <div class="chat-background">
      <MessagesContainer messages={activeMessages} isLoading={activeMeta.isLoading} />
    </div>
    <ChannelSidebar channel={navigationState.selectedChannel} bind:isOpen={sidebarOpen} />
  </div>

  <ChatInput
    selectedContent={!!navigationState.selectedChannel}
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
