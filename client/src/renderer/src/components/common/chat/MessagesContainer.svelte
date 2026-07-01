<script lang="ts">
  import type { Message, MessageReaction } from '$src/interfaces/Messages'
  import { tick, untrack } from 'svelte'
  import { useWebsocketSvelte } from '$src/composables/useWebsocket.svelte'
  import { WebSocketMessageType } from '$src/interfaces/WebSocketMessageType'
  import type { WebSocketMessage } from '$src/interfaces/WebSocketMessages'
  import { encryptionService } from '$src/services/EncryptionService'
  import MessageBubble from '$src/components/common/chat/MessageBubble.svelte'
  import { reactionService } from '$src/services/ReactionService'
  import { messageSenderService } from '$src/services/MessageSenderService'
  import { messageLoaderService } from '$src/services/MessageLoaderService'
  import { conversationsState, defaultMeta } from '$src/states/ConversationsState.svelte.js'
  import { sessionState } from '$src/states/SessionState.svelte'
  import Spinner from '$src/components/common/Spinner.svelte'
  import TypingIndicator from '$src/components/common/chat/TypingIndicator.svelte'
  import type { TypingUser } from '$src/states/TypingIndicatorState.svelte'

  let {
    messages,
    isLoading = false,
    isDirectMessage = false,
    typingUsers = [],
    messagesContainer = $bindable()
  }: {
    messages: (Message | undefined)[]
    isLoading?: boolean
    isDirectMessage?: boolean
    typingUsers?: TypingUser[]
    messagesContainer?: HTMLDivElement
  } = $props()

  const CLUMP_THRESHOLD_MS = 60_000

  let scrollHeightBeforePrepend = 0
  let isPrepending = $state(false)
  let isAtBottom = $state(true)
  let autoFollow = true
  let lastScrollTop = 0
  let lastMessageCount = 0
  let lastConversationId = $state<number | undefined>(undefined)
  let initialScrollDone = $state(false)

  const activeMeta = $derived(
    conversationsState.conversationMetaById.get(conversationsState.currentConversation?.id) ??
    defaultMeta()
  )

  async function handleIncomingEditedMessage(data: WebSocketMessage<Message>): Promise<void> {
    const edited = data.payload
    const convId = edited.conversationId

    const currentMessages = conversationsState.messagesByConversationId.get(convId)
    if (!currentMessages) return

    const index = currentMessages.findIndex((m) => m?.id === edited.id)
    if (index === -1) return

    let newContent = edited.content
    if (conversationsState.currentConversation?.type === 'DIRECT') {
      try {
        newContent = await encryptionService.decryptMessage(
          edited.content,
          edited.user.id !== sessionState.currentUser?.id
        )
      } catch {
        newContent = '[Unable to decrypt]'
      }
    }

    const updatedMessages = [...currentMessages]
    updatedMessages[index] = {
      ...currentMessages[index],
      content: newContent,
      isEdited: true
    }

    conversationsState.messagesByConversationId.set(convId, updatedMessages)
  }

  async function handleIncomingDeletedMessage(data: WebSocketMessage<Message>): Promise<void> {
    conversationsState.deleteMessage(data.payload)
  }

  useWebsocketSvelte({
    [WebSocketMessageType.RECEIVE_EDIT_MESSAGE]: async (data: WebSocketMessage<Message>) => {
      await handleIncomingEditedMessage(data)
    },
    [WebSocketMessageType.RECEIVE_DELETE_MESSAGE]: async (data: WebSocketMessage<Message>) => {
      await handleIncomingDeletedMessage(data)
    },
    [WebSocketMessageType.RECEIVE_ADD_REACTION]: (data: WebSocketMessage<MessageReaction>) => {
      reactionService.handleIncomingReactionAdded(data.payload)
    },
    [WebSocketMessageType.RECEIVE_REMOVE_REACTION]: (data: WebSocketMessage<MessageReaction>) => {
      reactionService.handleIncomingReactionRemoved(data.payload)
    }
  })

  function scrollToBottom(behavior: 'instant' | 'smooth' | 'auto' = 'instant'): void {
    if (!messagesContainer) return
    messagesContainer.scrollTo({ top: messagesContainer.scrollHeight, behavior })
  }

  function onEditMessage(message: Message, editedContent: string): void {
    const conv = conversationsState.currentConversation
    if (!conv) return
    if (conv.type === 'DIRECT') {
      messageSenderService.editMessagePrivateMessage(message, editedContent, conv.otherUserId)
    } else {
      messageSenderService.editChannelMessage(message, editedContent)
    }
  }

  function onScroll(): void {
    if (!messagesContainer || isPrepending) return
    const { scrollTop, scrollHeight, clientHeight } = messagesContainer
    isAtBottom = scrollHeight - scrollTop - clientHeight < 60

    if (scrollTop < lastScrollTop - 2) autoFollow = false
    else if (isAtBottom) autoFollow = true
    lastScrollTop = scrollTop

    if (scrollTop < 20 && activeMeta.hasMore && !activeMeta.isLoading) {
      void loadOlderMessages()
    }
  }

  async function loadOlderMessages(): Promise<void> {
    if (!messagesContainer || isPrepending) return

    const conv = conversationsState.currentConversation
    if (!conv) return

    const oldestId = messages[0]?.id
    if (!oldestId) return

    isPrepending = true
    scrollHeightBeforePrepend = messagesContainer.scrollHeight

    await tick()
    const result = await messageLoaderService.fetchMessagesBefore(conv, oldestId)

    const existingMessages = conversationsState.messagesByConversationId.get(conv.id) ?? []
    conversationsState.messagesByConversationId.set(conv.id, [
      ...result.messages,
      ...existingMessages
    ])

    const currentMeta = conversationsState.conversationMetaById.get(conv.id) ?? defaultMeta()
    conversationsState.conversationMetaById.set(conv.id, {
      ...currentMeta,
      hasMore: result.hasMore
    })

    await tick()

    messagesContainer.scrollTop = messagesContainer.scrollHeight - scrollHeightBeforePrepend
    isPrepending = false
  }

  $effect(() => {
    const currentId = conversationsState.currentConversation?.id

    if (currentId !== lastConversationId) {
      lastConversationId = currentId
      initialScrollDone = false
      return
    }

    const hasMessages = messages.length > 0
    const ready = !isLoading && !isPrepending

    if (ready && hasMessages && !initialScrollDone) {
      untrack(() => {
        tick().then(() => {
          requestAnimationFrame(() => {
            if (messagesContainer) {
              scrollToBottom('instant')
              initialScrollDone = true
              autoFollow = true
              lastScrollTop = messagesContainer.scrollTop
              lastMessageCount = messages.length
            }
          })
        })
      })
    }
  })

  $effect(() => {
    const len = messages.length
    untrack(() => {
      if (!initialScrollDone || isPrepending || isLoading) return
      if (len <= lastMessageCount) {
        lastMessageCount = len
        return
      }
      lastMessageCount = len
      const isMine = messages[len - 1]?.user?.id === sessionState.currentUser?.id
      if (isMine) autoFollow = true
      if (autoFollow) {
        tick().then(() => scrollToBottom('smooth'))
      }
    })
  })

  $effect(() => {
    const container = messagesContainer
    if (!container) return undefined
    const onImageLoad = (): void => {
      if (autoFollow) scrollToBottom('instant')
    }
    container.addEventListener('load', onImageLoad, true)
    return () => container.removeEventListener('load', onImageLoad, true)
  })

  function shouldShowMeta(message: Message, next: Message | undefined): boolean {
    if (!next) return true
    if (next.user.id !== message.user.id) return true
    return (
      new Date(next.createdAt).getTime() - new Date(message.createdAt).getTime() >
      CLUMP_THRESHOLD_MS
    )
  }

  function isMessageRead(message: Message): boolean {
    const conv = conversationsState.currentConversation
    if (conv?.type !== 'DIRECT') return false
    if (message.user.id !== sessionState.currentUser?.id) return false
    if (conv.otherUserReadAt == null) return false
    return new Date(message.createdAt) <= new Date(conv.otherUserReadAt)
  }

  function isFirstInClump(message: Message, prev: Message | undefined): boolean {
    if (!prev) return true
    if (prev.user.id !== message.user.id) return true
    return (
      new Date(message.createdAt).getTime() - new Date(prev.createdAt).getTime() >
      CLUMP_THRESHOLD_MS
    )
  }
</script>

<div class="messages-wrapper" bind:this={messagesContainer} onscroll={onScroll}>
  {#if isLoading}
    <div class="full-loader">
      <Spinner size={24} />
    </div>
  {:else}
    <div class="messages">
      <div class="top-status">
        {#if isPrepending}
          <div class="top-status__loading">
            <Spinner size={14} />
            <span>Loading older messages…</span>
          </div>
        {:else if !activeMeta.hasMore}
          <div class="top-status__start">
            <span>Beginning of conversation</span>
          </div>
        {/if}
      </div>

      {#each messages as message, i (message?.id)}
        {#if message}
          {@const prev = messages[i - 1]}
          {@const next = messages[i + 1]}
          {@const showMeta = shouldShowMeta(message, next)}
          {@const showDisplayName = isFirstInClump(message, prev)}
          {@const isRead = isMessageRead(message)}

          <div
            class="message-row"
            class:sent={message.user.id === sessionState.currentUser?.id}
            class:clumped={!showMeta}
          >
            <MessageBubble
              {message}
              {showMeta}
              {showDisplayName}
              {isRead}
              {onEditMessage}
              showReadStatus={isDirectMessage}
            />
          </div>
        {/if}
      {/each}
    </div>
  {/if}

  <TypingIndicator users={typingUsers} />
</div>

<style>
  .messages-wrapper {
    flex: 1;
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow-x: hidden;
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
    padding-bottom: 10px;
  }

  .message-row.clumped {
    padding-top: 0;
    padding-bottom: 0;
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

  .messages-wrapper :global(.typing-indicator) {
    flex-shrink: 0;
    margin-top: auto;
    background: #ffffff;
    padding-top: 4px;
  }
</style>
