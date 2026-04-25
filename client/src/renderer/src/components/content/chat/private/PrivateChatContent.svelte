<script lang="ts">
  import { conversationsState, defaultMeta } from '$src/states/ConversationsState.svelte.js'
  import { chatService } from '$src/services/ChatService'
  import { callService } from '$src/services/call/CallService'
  import ChatInput from '$src/components/common/chat/ChatInput.svelte'
  import MessagesContainer from '$src/components/common/chat/MessagesContainer.svelte'
  import PrivateChatHeader from '$src/components/content/chat/private/PrivateChatHeader.svelte'
  import { notificationState } from '$src/states/NotificationState.svelte'
  import { navigationState } from '$src/states/NavigationState.svelte'
  import { sessionState } from '$src/states/SessionState.svelte'

  let messageInput = $state('')
  let chatInputRef = $state<ChatInput | null>(null)
  const activeConv = $derived(conversationsState.currentConversation)
  const activeMessages = $derived(
    conversationsState.messagesByConversationId.get(activeConv?.id) ?? []
  )
  const activeMeta = $derived(
    conversationsState.conversationMetaById.get(activeConv?.id) ?? defaultMeta()
  )

  $effect(() => {
    if (navigationState.selectedUser) {
      chatService.loadConversationForUser(navigationState.selectedUser)
      chatInputRef?.focus()
    }
  })

  async function handleSubmitMessage(event: SubmitEvent): Promise<void> {
    event.preventDefault()

    if (
      !navigationState.selectedUser ||
      !messageInput.trim() ||
      !sessionState.currentUser ||
      activeMeta.isLoading
    )
      return

    const messageContent = messageInput
    messageInput = ''

    if (activeConv) {
      const message = await chatService.sendMessage(
        sessionState.currentUser,
        activeConv,
        messageContent
      )
      conversationsState.appendMessage(message, false)
    } else {
      const { message } = await chatService.sendMessageAndStartConversation(
        sessionState.currentUser,
        navigationState.selectedUser.id,
        messageContent
      )
      conversationsState.appendMessage(message, false)
    }
  }

  function startCall(): void {
    if (navigationState.selectedUser) {
      callService.startCall(null, navigationState.selectedUser, false, false)
    }
  }

  function handleVideoCall(): void {
    if (navigationState.selectedUser) {
      callService.startCall(null, navigationState.selectedUser, false, true)
    }
  }
</script>

<svelte:window
  onfocus={() => {
    if (activeConv && notificationState.hasUnread(activeConv.id)) {
      chatService.markConversationAsRead(activeConv.id)
    }
  }}
/>

<div class="chat">
  {#if navigationState.selectedUser}
    <PrivateChatHeader
      handleStartCall={startCall}
      handleStartVideoCall={handleVideoCall}
      isLoading={activeMeta.isLoading}
    />
    <div class="chat-background">
      <MessagesContainer
        messages={activeMessages}
        isLoading={activeMeta.isLoading}
        isDirectMessage={true}
      />
    </div>
    <ChatInput
      bind:this={chatInputRef}
      selectedContent={true}
      bind:messageInput
      onSubmit={handleSubmitMessage}
    />
  {:else}{/if}
</div>

<style>
  .chat {
    display: flex;
    flex-direction: column;
    min-height: 0;
    gap: 10px;
    width: 100%;
    z-index: 2;
  }

  .chat-background {
    flex: 1;
    min-height: 0;
    background-color: white;
    border-radius: 15px;
    overflow: hidden;
    z-index: 1;
    display: flex;
    flex-direction: column;
  }

  .empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
  }

  .empty-state-icon {
    color: #b0b0b0;
  }

  .empty-state-text {
    color: #888;
    font-size: 15px;
    font-family: inherit;
    margin: 0;
  }
</style>
