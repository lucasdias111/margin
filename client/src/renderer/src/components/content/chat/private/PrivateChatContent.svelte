<script lang="ts">
  import { conversationsState, defaultMeta } from '$src/states/ConversationsState.svelte.js'
  import { messageLoaderService } from '$src/services/MessageLoaderService'
  import { messageSenderService } from '$src/services/MessageSenderService'
  import type { DirectConversation } from '$src/interfaces/Conversation'
  import { callService } from '$src/services/call/CallService'
  import ChatInput from '$src/components/common/chat/input/ChatInput.svelte'
  import MessagesContainer from '$src/components/common/chat/MessagesContainer.svelte'
  import PrivateChatHeader from '$src/components/content/chat/private/PrivateChatHeader.svelte'
  import { navigationState } from '$src/states/NavigationState.svelte'
  import { sessionState } from '$src/states/SessionState.svelte'
  import { subscriptionState } from '$src/states/SubscriptionState.svelte'
  import { typingIndicatorService } from '$src/services/TypingIndicatorService'
  import { typingIndicatorState } from '$src/states/TypingIndicatorState.svelte'
  import { untrack } from 'svelte'
  import { usersState } from '$src/states/UsersState.svelte'
  import type { User } from '$src/interfaces/User'
  import { riseIn } from '$src/animations'

  let messageInput = $state('')
  let chatInputRef = $state<ChatInput | null>(null)
  const canUploadFiles = $derived((subscriptionState.subscription?.limits.maxStorageGb ?? 1) > 0)
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

  const typingUsers = $derived(
    activeConversation
      ? (typingIndicatorState.byConversationId.get(activeConversation.id) ?? [])
      : []
  )

  $effect(() => {
    const user = selectedUser
    if (user) {
      untrack(() => {
        messageLoaderService.loadConversationForUser(user)
      })
    }
  })

  $effect(() => {
    const id = activeConversation?.id
    if (!id) return
    if (messageInput.length > 0) {
      typingIndicatorService.notifyTyping(id)
    } else {
      typingIndicatorService.stopTyping(id)
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
    inlineFiles: File[],
    gifUrl: string | null
  ): Promise<void> {
    event.preventDefault()

    const hasText = messageInput.trim() || gifUrl != null
    if (
      !selectedUser ||
      (!hasText && inlineFiles.length === 0) ||
      (!activeConversation && !hasText) ||
      !sessionState.currentUser ||
      activeMeta.isLoading
    )
      return

    const messageContent = gifUrl ? `${messageInput}\n${gifUrl}`.trim() : messageInput
    messageInput = ''

    if (activeConversation) {
      await messageSenderService.sendDirectMessage(
        sessionState.currentUser,
        activeConversation as DirectConversation,
        messageContent,
        inlineFiles
      )
    } else {
      const { conversation, message } = await messageSenderService.sendMessageAndStartConversation(
        sessionState.currentUser,
        selectedUser.id,
        messageContent
      )
      conversationsState.appendMessage(message, false)
      if (inlineFiles.length > 0) {
        await messageSenderService.sendDirectMessage(
          sessionState.currentUser,
          conversation as DirectConversation,
          '',
          inlineFiles
        )
      }
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
      messageLoaderService.markConversationAsRead(activeConversation.id)
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
      isSecret={activeConversation?.type !== 'CHANNEL' && activeConversation?.encrypted}
    />
    <div class="pane chat-background">
      <MessagesContainer
        messages={activeMessages}
        isLoading={activeMeta.isLoading}
        isDirectMessage={true}
        {typingUsers}
      />
    </div>
    <ChatInput
      bind:this={chatInputRef}
      selectedContent={true}
      bind:messageInput
      onSubmit={handleSubmitMessage}
      allowFileAttachments={false}
      fileUploadEnabled={canUploadFiles}
    />
  {:else}
    <div class="empty-state" in:riseIn={{ distance: 10 }}>
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
