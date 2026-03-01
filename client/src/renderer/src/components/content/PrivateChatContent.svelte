<script lang="ts">
  import { onDestroy, onMount, tick } from 'svelte'
  import type { User } from '$src/interfaces/User'
  import type { ConversationMessagesResponse, Message } from '$src/interfaces/Messages'
  import { userState } from '$src/states/UserState.svelte'
  import { webSocketService } from '$src/services/WebSocketService'
  import { chatState } from '$src/states/ChatState.svelte'
  import { authenticatedGet } from '$src/services/api'
  import ChatInput from '$src/components/chat/ChatInput.svelte'
  import MessagesContainer from '$src/components/chat/MessagesContainer.svelte'
  import { chatService } from '$src/services/ChatService'
  import { encryptionService } from '$src/services/EncryptionService'
  import { WebSocketMessageType } from '$src/interfaces/WebSocketMessageType'
  import type { WebSocketMessage } from '$src/interfaces/WebSocketMessages'
  import { callService } from '$src/services/CallService'
  import { callState } from '$src/states/CallState.svelte'
  import ChatHeader from '$src/components/content/ChatHeader.svelte'
  import type { Conversation, DirectConversation } from '$src/interfaces/Conversation'

  let selectedUser = $state<User | null>(null)
  let currentConversation = $state<Conversation | null>(null)
  let messages = $state<Message[]>([])
  let messageInput = $state('')
  let messagesContainer = $state<HTMLDivElement>(null)

  $effect(() => {
    tick().then(() => {
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight
      }
    })

    if (chatState.selectedUser) {
      loadMessagesForUser(chatState.selectedUser)
    }
  })

  onMount(() => {
    webSocketService.on(WebSocketMessageType.RECEIVE_MESSAGE, handleIncomingMessage)
  })

  onDestroy(() => {
    webSocketService.off(WebSocketMessageType.RECEIVE_MESSAGE, handleIncomingMessage)
  })

  async function handleIncomingMessage(data: WebSocketMessage<Message>): Promise<void> {
    const incomingMsg: Message = data.payload

    if (!currentConversation) {
      if (incomingMsg.conversationType === 'DIRECT' && selectedUser) {
        currentConversation = {
          id: incomingMsg.conversationId,
          type: 'DIRECT',
          otherUserId: selectedUser.id, // ← always the person we're chatting with, not the sender
          createdAt: incomingMsg.createdAt
        } satisfies DirectConversation
      } else {
        return
      }
    }

    if (incomingMsg.conversationId !== currentConversation.id) return

    try {
      const isFromMe = incomingMsg.user.id === userState.currentUser?.id
      incomingMsg.content = await encryptionService.decryptMessage(incomingMsg.content, !isFromMe)
    } catch (error) {
      console.error('Failed to decrypt message:', error)
      incomingMsg.content = '[Decryption failed]'
    }

    messages = [...messages, incomingMsg]
    await chatService.markConversationAsRead(currentConversation.id)
  }

  async function handleSubmitMessage(event: SubmitEvent): Promise<void> {
    event.preventDefault()

    if (!selectedUser || !messageInput.trim() || !userState.currentUser) return

    const messageContent = messageInput
    messageInput = ''

    if (currentConversation) {
      await chatService.sendMessage(userState.currentUser, currentConversation, messageContent)
    } else {
      await chatService.sendMessageAndStartConversation(
        userState.currentUser,
        selectedUser.id,
        messageContent
      )
    }
  }

  function startCall(): void {
    if (selectedUser) {
      callState.setVideoEnabled(false)
      callService.startCall(null, selectedUser.id, false, null)
    }
  }

  function handleVideoCall(): void {
    if (selectedUser) {
      callState.setVideoEnabled(true)
      callService.startCall(null, selectedUser.id, false, null)
    }
  }

  let isLoading = $state(false)

  export async function loadMessagesForUser(user: User): Promise<void> {
    if (selectedUser && selectedUser.id === user.id) return

    selectedUser = user
    currentConversation = null
    messages = []
    isLoading = true

    try {
      const response = await authenticatedGet(
        `api/conversations/${user.id}/direct_messages?limit=100`
      )

      if (!response.ok) {
        console.error('Failed to load messages')
        return
      }

      const messageResponse: ConversationMessagesResponse = await response.json()

      if (messageResponse.conversation == null) {
        return
      }

      currentConversation = messageResponse.conversation

      messages = await Promise.all(
        messageResponse.messages.map(async (message) => {
          try {
            const isRecipient = message.user.id !== userState.currentUser.id
            message.content = await encryptionService.decryptMessage(message.content, isRecipient)
            return message
          } catch (decryptError) {
            console.error('Failed to decrypt message:', decryptError)
            message.content = '[Decryption failed]'
            return message
          }
        })
      )

      await chatService.markConversationAsRead(currentConversation.id)
    } catch (error) {
      console.error('Error loading messages:', error)
      messages = []
    } finally {
      isLoading = false
    }
  }
</script>

<div class="chat">
  {#if selectedUser}
    <ChatHeader
      name={selectedUser.username}
      handleStartCall={startCall}
      handleStartVideoCall={handleVideoCall}
    />
  {/if}
  <div class="chat-background">
    <MessagesContainer {messages} {isLoading} isDirectMessage={true} bind:messagesContainer />
  </div>
  <ChatInput selectedContent={!!selectedUser} bind:messageInput onSubmit={handleSubmitMessage} />
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
