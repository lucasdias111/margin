<script lang="ts">
  import type { Message } from '$src/interfaces/Messages'
  import { tick, untrack } from 'svelte'
  import MessageBubble from '$src/components/common/chat/MessageBubble.svelte'
  import PostBody from '$src/components/common/chat/PostBody.svelte'
  import { messageSenderService } from '$src/services/MessageSenderService'
  import { messageLoaderService } from '$src/services/MessageLoaderService'
  import { conversationsState, defaultMeta } from '$src/states/ConversationsState.svelte.js'
  import { sessionState } from '$src/states/SessionState.svelte'
  import Spinner from '$src/components/common/Spinner.svelte'
  import MessagesSkeleton from '$src/components/common/chat/MessagesSkeleton.svelte'
  import TypingIndicator from '$src/components/common/chat/TypingIndicator.svelte'
  import type { TypingUser } from '$src/states/TypingIndicatorState.svelte'
  import type { Conversation } from '$src/interfaces/Conversation'
  import type { TransitionConfig } from 'svelte/transition'
  import { listItemIn, viewOut } from '$src/animations'

  let {
    messages,
    isLoading = false,
    isDirectMessage = false,
    typingUsers = [],
    conversation = undefined,
    postStyle = false,
    messagesContainer = $bindable()
  }: {
    messages: (Message | undefined)[]
    isLoading?: boolean
    isDirectMessage?: boolean
    typingUsers?: TypingUser[]
    conversation?: Conversation
    postStyle?: boolean
    messagesContainer?: HTMLDivElement
  } = $props()

  const activeConversation = $derived(conversation ?? conversationsState.currentConversation)

  const CLUMP_THRESHOLD_MS = 60_000

  let scrollHeightBeforePrepend = 0
  let isPrepending = $state(false)
  let isAtBottom = $state(true)
  let autoFollow = true
  let lastScrollTop = 0
  let lastMessageCount = 0
  let lastConversationId = $state<number | undefined>(undefined)
  let initialScrollDone = $state(false)
  /**
   * The conversation whose list has finished settling. Compared against the
   * active id rather than kept as a bare boolean so visibility flips the
   * instant you switch chats, instead of one effect-tick later.
   */
  let readyConversationId = $state<number | undefined>(undefined)

  const activeMeta = $derived(
    conversationsState.conversationMetaById.get(activeConversation?.id) ?? defaultMeta()
  )

  function scrollToBottom(behavior: 'instant' | 'smooth' | 'auto' = 'instant'): void {
    if (!messagesContainer) return
    messagesContainer.scrollTo({ top: messagesContainer.scrollHeight, behavior })
  }

  function onEditMessage(message: Message, editedContent: string): void {
    const conv = activeConversation
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

    const conv = activeConversation
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
    const currentId = activeConversation?.id

    if (currentId !== lastConversationId) {
      lastConversationId = currentId
      initialScrollDone = false
      return
    }

    const hasMessages = messages.length > 0
    const ready = !isLoading && !isPrepending

    if (!ready || initialScrollDone) return

    // Nothing to scroll to — reveal straight away.
    if (!hasMessages) {
      initialScrollDone = true
      readyConversationId = currentId
      return
    }

    untrack(() => {
      tick().then(() => {
        requestAnimationFrame(() => {
          if (messagesContainer) {
            scrollToBottom('instant')
            autoFollow = true
            lastScrollTop = messagesContainer.scrollTop
          }

          // Reveal even if the container went away: the list being hidden is a
          // presentation detail, and a missed callback must never be able to
          // leave the chat permanently blank.
          lastMessageCount = messages.length
          initialScrollDone = true
          readyConversationId = currentId
        })
      })
    })
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
    const conv = activeConversation
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

  /**
   * The list stays hidden until the initial scroll-to-bottom for *this*
   * conversation has landed, which hides the paint-then-jump. Keyed on the id so
   * it goes false the moment you switch, cached conversations included.
   */
  const contentVisible = $derived(activeConversation?.id === readyConversationId)

  /**
   * Rise-in for messages that arrive while you're watching. Deliberately inert
   * during the initial paint and while older history is being prepended — a
   * whole backlog animating at once reads as jank, not life.
   */
  function messageIn(node: Element): TransitionConfig {
    // `contentVisible`, not `initialScrollDone`: the latter is reset by an
    // effect that runs *after* the keyed remount, so the whole backlog would
    // animate on every switch.
    if (!contentVisible || isPrepending) return {}
    return listItemIn(node, { distance: 10 })
  }
</script>

<div class="messages-wrapper" bind:this={messagesContainer} onscroll={onScroll}>
  {#if isLoading}
    <div class="full-loader" out:viewOut>
      <MessagesSkeleton />
    </div>
  {:else}
    <!--
      Keyed so switching chats builds a fresh list. Without the remount the same
      element just has a class toggled off and on, and the browser reverses the
      in-flight fade instead of replaying it.
    -->
    {#key activeConversation?.id}
      <div class="messages" class:visible={contentVisible}>
        {#if isPrepending || (!activeMeta.hasMore && !postStyle)}
          <div class="top-status">
            {#if isPrepending}
              <div class="top-status__loading">
                <Spinner size={14} />
                <span>Loading older messages…</span>
              </div>
            {:else}
              <div class="top-status__start">
                <span>Beginning of conversation</span>
              </div>
            {/if}
          </div>
        {/if}

        {#each messages as message, i (message?.id)}
          {#if message}
            {@const isPostBody = postStyle && !activeMeta.hasMore && i === 0}
            {@const prev = messages[i - 1]}
            {@const next = messages[i + 1]}
            {@const showMeta = shouldShowMeta(message, next)}
            {@const showDisplayName = isFirstInClump(message, prev)}
            {@const isRead = isMessageRead(message)}

            {#if isPostBody}
              <div class="post-body-row">
                <PostBody {message} {onEditMessage} />
              </div>
              <div class="replies-divider">
                <span>
                  {messages.length - 1}
                  {messages.length - 1 === 1 ? 'reply' : 'replies'}
                </span>
              </div>
            {:else}
              <div
                class="message-row"
                class:sent={message.user.id === sessionState.currentUser?.id}
                class:clumped={!showMeta}
                in:messageIn
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
          {/if}
        {/each}
      </div>
    {/key}
  {/if}

  <TypingIndicator users={typingUsers} />
</div>

<style>
  /**
   * Fade the list in once it's scrolled where it belongs. The transform nudge
   * gives the reveal a little travel so it doesn't just blink on.
   */
  .messages {
    opacity: 0;
    transform: translate3d(0, 6px, 0);
    transition:
      opacity var(--motion-slow) var(--ease-standard),
      transform var(--motion-slow) var(--ease-standard);
  }

  .messages.visible {
    opacity: 1;
    transform: none;
  }

  .messages-wrapper {
    position: relative;
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

  .post-body-row {
    width: 100%;
    padding-bottom: 4px;
  }

  .replies-divider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 6px 0 12px;
    color: #aaa;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.03em;
    text-transform: uppercase;
  }

  .replies-divider::before,
  .replies-divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #ece8e0;
  }

  .message-row.clumped {
    padding-top: 0;
    padding-bottom: 0;
  }

  .message-row.sent {
    justify-content: flex-end;
  }

  /**
   * The skeleton is layered over the pane rather than sitting in the flow, so
   * the real list can mount underneath and fade up while the skeleton leaves.
   */
  .full-loader {
    position: absolute;
    inset: 0;
    z-index: 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    min-height: 200px;
    pointer-events: none;
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
