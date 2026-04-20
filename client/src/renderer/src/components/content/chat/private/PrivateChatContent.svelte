<script lang="ts">
  import { chatState } from '$src/states/ChatState.svelte.js'
  import { conversationState } from '$src/states/ConversationState.svelte.js'
  import { chatService } from '$src/services/ChatService'
  import { callService } from '$src/services/call/CallService'
  import { userState } from '$src/states/UserState.svelte.js'
  import ChatInput from '$src/components/common/chat/ChatInput.svelte'
  import MessagesContainer from '$src/components/common/chat/MessagesContainer.svelte'
  import PrivateChatHeader from '$src/components/content/chat/private/PrivateChatHeader.svelte'
  import Icon from '$src/components/common/icons/Icon.svelte'
  import { notificationState } from '$src/states/NotificationState.svelte'

  let messageInput = $state('')
  let chatInputRef = $state<ChatInput | null>(null)

  $effect(() => {
    if (chatState.selectedUser) {
      chatService.loadConversationForUser(chatState.selectedUser)
      chatInputRef?.focus()
    }
  })

  async function handleSubmitMessage(event: SubmitEvent): Promise<void> {
    event.preventDefault()

    if (
      !chatState.selectedUser ||
      !messageInput.trim() ||
      !userState.currentUser ||
      conversationState.isLoading
    )
      return

    const messageContent = messageInput
    messageInput = ''

    if (conversationState.currentConversation) {
      const message = await chatService.sendMessage(
        userState.currentUser,
        conversationState.currentConversation,
        messageContent
      )
      conversationState.messages = [...conversationState.messages, message]
    } else {
      const { conversation, message } = await chatService.sendMessageAndStartConversation(
        userState.currentUser,
        chatState.selectedUser.id,
        messageContent
      )
      conversationState.selectConversation(conversation)
      conversationState.messages = [message]
    }
  }

  function startCall(): void {
    if (chatState.selectedUser) {
      callService.startCall(null, chatState.selectedUser, false, false)
    }
  }

  function handleVideoCall(): void {
    if (chatState.selectedUser) {
      callService.startCall(null, chatState.selectedUser, false, true)
    }
  }
</script>

<svelte:window
  onfocus={() => {
    if (
      chatState.selectedUser &&
      conversationState.currentConversation &&
      notificationState.hasUnread(conversationState.currentConversation.id)
    ) {
      chatService.markConversationAsRead(conversationState.currentConversation.id)
    }
  }}
/>

<div class="chat">
  {#if chatState.selectedUser}
    <PrivateChatHeader
      handleStartCall={startCall}
      handleStartVideoCall={handleVideoCall}
      isLoading={conversationState.isLoading}
    />
    <div class="chat-background">
      <MessagesContainer
        messages={conversationState.messages}
        isLoading={conversationState.isLoading}
        isDirectMessage={true}
      />
    </div>
    <ChatInput
      bind:this={chatInputRef}
      selectedContent={true}
      bind:messageInput
      onSubmit={handleSubmitMessage}
    />
  {:else}
    <div class="empty-state">
      <div class="empty-state-icon">
        <Icon name="messages" size={40} />
      </div>
      <p class="empty-state-text">Select a conversation to start chatting</p>
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
