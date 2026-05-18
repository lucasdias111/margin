<script lang="ts">
  import ChatInput from '$src/components/common/chat/input/ChatInput.svelte'
  import MessagesContainer from '$src/components/common/chat/MessagesContainer.svelte'
  import { chatService } from '$src/services/ChatService'
  import ChannelSidebar from '$src/components/content/chat/channel/sidebar/ChannelSidebar.svelte'
  import ChannelChatHeader from '$src/components/content/chat/channel/ChannelChatHeader.svelte'
  import { channelService } from '$src/services/ChannelService'
  import { navigationState } from '$src/states/NavigationState.svelte'
  import { sessionState } from '$src/states/SessionState.svelte'
  import { conversationsState, defaultMeta } from '$src/states/ConversationsState.svelte'
  import { subscriptionState } from '$src/states/SubscriptionState.svelte'
  import { untrack } from 'svelte'

  let messageInput = $state('')
  let sidebarOpen = $state(true)

  const canUploadFiles = $derived(
    (subscriptionState.subscription?.limits.maxStorageGb ?? 1) > 0
  )

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
    const channel = navigationState.selectedChannel
    if (channel) {
      untrack(() => {
        chatService.loadConversationForChannel(channel)
      })
    }
  })

  async function handleSubmit(
    event: SubmitEvent,
    files: File[],
    inlineFiles: File[],
    gifUrl: string | null
  ): Promise<void> {
    event.preventDefault()
    if (
      !navigationState.selectedChannel ||
      (!messageInput.trim() && files.length === 0 && inlineFiles.length === 0 && gifUrl == null) ||
      !sessionState.currentUser
    )
      return

    const messageContent = gifUrl ? `${messageInput}\n${gifUrl}`.trim() : messageInput
    messageInput = ''

    const message = await chatService.sendChannelMessage(
      sessionState.currentUser,
      navigationState.selectedChannel,
      messageContent,
      files,
      inlineFiles
    )

    if (message) conversationsState.appendMessage(message, false)
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
      onBack={() => channelService.select(null)}
    />
  {/if}

  <div class="chat-body">
    <div class="pane chat-background">
      <MessagesContainer messages={activeMessages} isLoading={activeMeta.isLoading} />
    </div>
    <ChannelSidebar channel={navigationState.selectedChannel} bind:isOpen={sidebarOpen} />
  </div>

  <ChatInput
    selectedContent={!!navigationState.selectedChannel}
    bind:messageInput
    onSubmit={handleSubmit}
    fileUploadEnabled={canUploadFiles}
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
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  @media (max-width: 768px) {
    .chat {
      gap: 0;
    }

    .chat-body {
      gap: 0;
    }

    .chat-background {
      border-radius: 0;
    }
  }
</style>
