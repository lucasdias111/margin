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

  function scrollToBottom(): void {
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight
    }
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

  $effect(() => {
    void messages.length
    if (isLoading) return
    tick().then(scrollToBottom)
  })
</script>

<div class="messages-wrapper" bind:this={messagesContainer}>
  {#if isLoading}
    <div class="loading">
      <div class="spinner"></div>
    </div>
  {:else}
    <div class="messages">
      {#each messages as message (message.id)}
        <div class="messages-container" class:sent={message.user.id === userState.currentUser?.id}>
          {#if message.conversationType === 'DIRECT'}
            <MessageBubble {message} showReadStatus={true} {onEditMessage} />
          {:else}
            <MessageBubble {message} {onEditMessage} />
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .messages-wrapper {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }

  .messages {
    padding: 20px;
    scroll-behavior: smooth;
    display: flex;
    flex-direction: column;
    gap: 8px;
    box-sizing: border-box;
  }

  .messages-container {
    display: flex;
    justify-content: flex-start;
    width: 100%;
  }

  .messages-container.sent {
    justify-content: flex-end;
  }

  .loading {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 40px 0;
  }

  .spinner {
    width: 28px;
    height: 28px;
    border: 3px solid rgba(218, 107, 16, 0.2);
    border-top-color: #da6b10;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
