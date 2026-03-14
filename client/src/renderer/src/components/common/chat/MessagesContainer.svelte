<script lang="ts">
  import type { Message } from '$src/interfaces/Messages'
  import { tick } from 'svelte'
  import { userState } from '$src/states/UserState.svelte.js'
  import { useWebsocketSvelte } from '$src/composables/useWebsocket.svelte'
  import { WebSocketMessageType } from '$src/interfaces/WebSocketMessageType'
  import type { WebSocketMessage } from '$src/interfaces/WebSocketMessages'
  import { encryptionService } from '$src/services/EncryptionService'
  import MessageBubble from '$src/components/common/chat/MessageBubble.svelte'
  import { chatService } from '$src/services/ChatService'
  import { conversationState } from '$src/states/ConversationState.svelte'

  let {
    messages,
    isLoading = false,
    messagesContainer = $bindable()
  }: {
    messages: (Message | undefined)[]
    isLoading?: boolean
    messagesContainer?: HTMLDivElement
    isDirectMessage?: boolean
  } = $props()

  let scrollHeightBeforePrepend = 0
  let isPrepending = $state(false)
  let isAtBottom = $state(true)
  let initialScrollDone = false

  async function handleIncomingEditedMessage(data: WebSocketMessage<Message>): Promise<void> {
    const edited = data.payload
    const existing = messages.find((m) => m?.id === edited.id)
    if (!existing) return

    if (conversationState.currentConversation.type === 'DIRECT') {
      existing.content = await encryptionService.decryptMessage(
        edited.content,
        edited.user.id !== userState.currentUser.id
      )
    } else {
      existing.content = edited.content
    }
    existing.isEdited = true
  }

  async function handleIncomingDeletedMessage(data: WebSocketMessage<Message>): Promise<void> {
    messages = messages.filter((m) => m?.id !== data.payload.id)
  }

  useWebsocketSvelte({
    [WebSocketMessageType.RECEIVE_EDIT_MESSAGE]: async (data: WebSocketMessage<Message>) => {
      await handleIncomingEditedMessage(data)
    },
    [WebSocketMessageType.RECEIVE_DELETE_MESSAGE]: async (data: WebSocketMessage<Message>) => {
      await handleIncomingDeletedMessage(data)
    }
  })

  function scrollToBottom(behavior: 'instant' | 'smooth' | 'auto' = 'instant'): void {
    if (!messagesContainer) return
    messagesContainer.scrollTo({ top: messagesContainer.scrollHeight, behavior })
  }

  function onEditMessage(message: Message, editedContent: string): void {
    if (conversationState.currentConversation.type === 'DIRECT') {
      chatService.editMessagePrivateMessage(
        message,
        editedContent,
        conversationState.currentConversation.otherUserId
      )
    } else {
      chatService.editChannelMessage(message, editedContent)
    }
  }

  function onScroll(): void {
    if (!messagesContainer || isPrepending) return
    const { scrollTop, scrollHeight, clientHeight } = messagesContainer
    isAtBottom = scrollHeight - scrollTop - clientHeight < 60

    if (
      scrollTop < 20 &&
      conversationState.hasMore &&
      !conversationState.isLoadingMore &&
      !isPrepending
    ) {
      void loadOlderMessages()
    }
  }

  async function loadOlderMessages(): Promise<void> {
    if (!messagesContainer) return

    isPrepending = true
    scrollHeightBeforePrepend = messagesContainer.scrollHeight

    await tick()

    await chatService.loadMoreMessages()
    await tick()

    messagesContainer.scrollTop = messagesContainer.scrollHeight - scrollHeightBeforePrepend
    isPrepending = false
  }

  $effect(() => {
    if (isLoading) {
      initialScrollDone = false
      return
    }
    if (!initialScrollDone && messages.length > 0) {
      tick().then(() => {
        scrollToBottom('smooth')
        initialScrollDone = true
      })
    }
  })

  $effect(() => {
    void messages.length
    if (!initialScrollDone || isPrepending || isLoading) return
    if (isAtBottom) {
      tick().then(() => scrollToBottom('smooth'))
    }
  })
</script>

<div class="messages-wrapper" bind:this={messagesContainer} onscroll={onScroll}>
  {#if isLoading}
    <div class="full-loader">
      <div class="spinner"></div>
    </div>
  {:else}
    <div class="messages">
      <div class="top-status">
        {#if isPrepending}
          <div class="top-status__loading">
            <div class="spinner small"></div>
            <span>Loading older messages…</span>
          </div>
        {:else if !conversationState.hasMore}
          <div class="top-status__start">
            <span>Beginning of conversation</span>
          </div>
        {/if}
      </div>

      {#each messages as message (message?.id)}
        {#if message}
          <div class="message-row" class:sent={message.user.id === userState.currentUser?.id}>
            {#if message.conversationType === 'DIRECT'}
              <MessageBubble {message} showReadStatus={true} {onEditMessage} />
            {:else}
              <MessageBubble {message} {onEditMessage} />
            {/if}
          </div>
        {/if}
      {/each}
    </div>
  {/if}
</div>

<style>
  .messages-wrapper {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(0, 0, 0, 0.15) transparent;
  }

  .messages-wrapper::-webkit-scrollbar {
    width: 4px;
  }

  .messages-wrapper::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.15);
    border-radius: 2px;
  }

  .messages {
    padding: 12px 20px 20px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    box-sizing: border-box;
  }

  .message-row {
    display: flex;
    justify-content: flex-start;
    width: 100%;
  }

  .message-row.sent {
    justify-content: flex-end;
  }

  .full-loader {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 200px;
  }

  .top-status {
    min-height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 8px;
  }

  .top-status__loading {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #999;
    font-size: 12px;
    font-weight: 500;
  }

  .top-status__start {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    color: #aaa;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }

  .top-status__start::before,
  .top-status__start::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #ece8e0;
  }

  .spinner {
    width: 24px;
    height: 24px;
    border: 2.5px solid rgba(232, 113, 42, 0.2);
    border-top-color: #e8712a;
    border-radius: 50%;
    animation: spin 0.65s linear infinite;
    flex-shrink: 0;
  }

  .spinner.small {
    width: 14px;
    height: 14px;
    border-width: 2px;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
