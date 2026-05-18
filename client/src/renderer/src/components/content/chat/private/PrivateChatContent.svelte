<script lang="ts">
  import { conversationsState, defaultMeta } from '$src/states/ConversationsState.svelte.js'
  import { chatService } from '$src/services/ChatService'
  import { callService } from '$src/services/call/CallService'
  import ChatInput from '$src/components/common/chat/input/ChatInput.svelte'
  import MessagesContainer from '$src/components/common/chat/MessagesContainer.svelte'
  import PrivateChatHeader from '$src/components/content/chat/private/PrivateChatHeader.svelte'
  import { navigationState } from '$src/states/NavigationState.svelte'
  import { sessionState } from '$src/states/SessionState.svelte'
  import { untrack } from 'svelte'
  import { usersState } from '$src/states/UsersState.svelte'
  import type { User } from '$src/interfaces/User'

  let messageInput = $state('')
  let chatInputRef = $state<ChatInput | null>(null)
  const activeConversation = $derived(
    conversationsState.currentConversation
      ? conversationsState.byId.get(conversationsState.currentConversation.id)
      : undefined
  )
  const selectedUser: User | null = $derived(
    navigationState.selectedUser?.id ? usersState.byId.get(navigationState.selectedUser.id) : null
  )
  const activeMessages = $derived(
    conversationsState.messagesByConversationId.get(activeConversation?.id) ?? []
  )
  const activeMeta = $derived(
    conversationsState.conversationMetaById.get(activeConversation?.id) ?? defaultMeta()
  )

  $effect(() => {
    const user = selectedUser
    if (user) {
      untrack(() => {
        chatService.loadConversationForUser(user)
      })
    }
  })

  function focusInput(): void {
    untrack(() => chatInputRef.focus())
  }

  $effect(() => {
    if (selectedUser && chatInputRef) {
      focusInput()
    }
  })

  async function handleSubmitMessage(
    event: SubmitEvent,
    _files: File[],
    _inlineFiles: File[],
    gifUrl: string | null
  ): Promise<void> {
    event.preventDefault()

    if (
      !selectedUser ||
      (!messageInput.trim() && gifUrl == null) ||
      !sessionState.currentUser ||
      activeMeta.isLoading
    )
      return

    const messageContent = gifUrl ? `${messageInput}\n${gifUrl}`.trim() : messageInput
    messageInput = ''

    if (activeConversation) {
      const message = await chatService.sendMessage(
        sessionState.currentUser,
        activeConversation,
        messageContent
      )
      if (message) conversationsState.appendMessage(message, false)
    } else {
      const { message } = await chatService.sendMessageAndStartConversation(
        sessionState.currentUser,
        selectedUser.id,
        messageContent
      )
      conversationsState.appendMessage(message, false)
    }
  }

  function startCall(): void {
    if (selectedUser) {
      callService.startCall(null, selectedUser, false, false)
    }
  }

  function handleVideoCall(): void {
    if (selectedUser) {
      callService.startCall(null, selectedUser, false, true)
    }
  }
</script>

<svelte:window
  onfocus={() => {
    if (activeConversation) {
      chatService.markConversationAsRead(activeConversation.id)
      focusInput()
    }
  }}
/>

<div class="chat">
  {#if selectedUser}
    <PrivateChatHeader
      handleStartCall={startCall}
      handleStartVideoCall={handleVideoCall}
      isLoading={activeMeta.isLoading}
    />
    <div class="pane chat-background">
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
      allowFileAttachments={false}
    />
  {:else}
    <div class="empty-state">
      <p>Select a conversation or start a new one</p>
    </div>
  {/if}
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
    border-radius: 15px;
    overflow: hidden;
    z-index: 1;
    display: flex;
    flex-direction: column;
  }

  .empty-state {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .empty-state p {
    font-size: 13px;
    color: #bbb;
    margin: 0;
  }

  @media (max-width: 768px) {
    .chat {
      gap: 0;
    }

    .chat-background {
      border-radius: 0;
      border: none;
    }
  }
</style>
