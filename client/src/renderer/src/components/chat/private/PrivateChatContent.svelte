<script lang="ts">
  import { chatState } from '$src/states/ChatState.svelte.js'
  import { conversationState } from '$src/states/ConversationState.svelte.js'
  import { chatService } from '$src/services/ChatService'
  import { callService } from '$src/services/CallService'
  import { callState } from '$src/states/CallState.svelte.js'
  import { userState } from '$src/states/UserState.svelte.js'
  import ChatInput from '$src/components/common/chat/ChatInput.svelte'
  import MessagesContainer from '$src/components/common/chat/MessagesContainer.svelte'
  import ChatHeader from '$src/components/common/chat/ChatHeader.svelte'

  let messageInput = $state('')

  $effect(() => {
    if (chatState.selectedUser) {
      chatService.loadConversationForUser(chatState.selectedUser)
    }
  })

  async function handleSubmitMessage(event: SubmitEvent): Promise<void> {
    event.preventDefault()

    if (!chatState.selectedUser || !messageInput.trim() || !userState.currentUser) return

    const messageContent = messageInput
    messageInput = ''

    if (conversationState.currentConversation) {
      await chatService.sendMessage(
        userState.currentUser,
        conversationState.currentConversation,
        messageContent
      )
    } else {
      await chatService.sendMessageAndStartConversation(
        userState.currentUser,
        chatState.selectedUser.id,
        messageContent
      )
    }
  }

  function startCall(): void {
    if (chatState.selectedUser) {
      callState.setVideoEnabled(false)
      callService.startCall(null, chatState.selectedUser.id, false, null)
    }
  }

  function handleVideoCall(): void {
    if (chatState.selectedUser) {
      callState.setVideoEnabled(true)
      callService.startCall(null, chatState.selectedUser.id, false, null)
    }
  }
</script>

<div class="chat">
  {#if chatState.selectedUser}
    <ChatHeader
      userId={chatState.selectedUser.id}
      name={chatState.selectedUser.username}
      isLoading={conversationState.isLoading}
      handleStartCall={startCall}
      handleStartVideoCall={handleVideoCall}
    />
  {/if}
  <div class="chat-background">
    <MessagesContainer
      messages={conversationState.messages}
      isLoading={conversationState.isLoading}
      isDirectMessage={true}
    />
  </div>
  <ChatInput
    selectedContent={!!chatState.selectedUser}
    bind:messageInput
    onSubmit={handleSubmitMessage}
  />
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
</style>
