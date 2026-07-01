<script lang="ts">
  import { conversationsState, defaultMeta } from '$src/states/ConversationsState.svelte.js'
  import { messageLoaderService } from '$src/services/MessageLoaderService'
  import { messageSenderService } from '$src/services/MessageSenderService'
  import { isGroupConversation } from '$src/interfaces/Conversation'
  import ChatInput from '$src/components/common/chat/input/ChatInput.svelte'
  import MessagesContainer from '$src/components/common/chat/MessagesContainer.svelte'
  import GroupChatHeader from '$src/components/content/chat/group/GroupChatHeader.svelte'
  import { navigationState } from '$src/states/NavigationState.svelte'
  import { sessionState } from '$src/states/SessionState.svelte'
  import { untrack } from 'svelte'

  let messageInput = $state('')
  let chatInputRef = $state<ChatInput | null>(null)

  const activeGroup = $derived(
    navigationState.selectedGroupConversation
      ? conversationsState.byId.get(navigationState.selectedGroupConversation.id)
      : undefined
  )

  const activeMessages = $derived(
    conversationsState.messagesByConversationId.get(activeGroup?.id) ?? []
  )

  const activeMeta = $derived(
    conversationsState.conversationMetaById.get(activeGroup?.id) ?? defaultMeta()
  )

  $effect(() => {
    const group = navigationState.selectedGroupConversation
    if (group) {
      untrack(() => {
        messageLoaderService.loadConversationForGroup(group)
      })
    }
  })

  $effect(() => {
    if (navigationState.selectedGroupConversation && chatInputRef) {
      untrack(() => chatInputRef.focus())
    }
  })

  async function handleSubmitMessage(
    event: SubmitEvent,
    _files: File[],
    inlineFiles: File[],
    gifUrl: string | null
  ): Promise<void> {
    event.preventDefault()

    const group = activeGroup
    if (!group || !isGroupConversation(group) || !sessionState.currentUser) return

    const hasText = messageInput.trim() || gifUrl != null
    if ((!hasText && inlineFiles.length === 0) || activeMeta.isLoading) return

    const messageContent = gifUrl ? `${messageInput}\n${gifUrl}`.trim() : messageInput
    messageInput = ''

    await messageSenderService.sendGroupMessage(
      sessionState.currentUser,
      group,
      messageContent,
      inlineFiles
    )
  }
</script>

<svelte:window
  onfocus={() => {
    if (activeGroup) {
      messageLoaderService.markConversationAsRead(activeGroup.id)
      chatInputRef?.focus()
    }
  }}
/>

<div class="chat">
  {#if activeGroup && isGroupConversation(activeGroup)}
    <GroupChatHeader group={activeGroup} />

    <div class="pane chat-background">
      <MessagesContainer
        messages={activeMessages}
        isLoading={activeMeta.isLoading}
        isDirectMessage={false}
      />
    </div>

    <ChatInput
      bind:this={chatInputRef}
      selectedContent={true}
      bind:messageInput
      onSubmit={handleSubmitMessage}
      allowFileAttachments={false}
      fileUploadEnabled={false}
    />
  {:else}
    <div class="empty-state">
      <p>Select a group or create a new one</p>
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
