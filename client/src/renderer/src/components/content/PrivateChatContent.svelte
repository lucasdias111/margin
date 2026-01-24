<script lang="ts">
  import { onMount, onDestroy, tick } from 'svelte'
  import type { User } from '$src/interfaces/User'
  import type { DirectMessage } from '$src/interfaces/Messages'
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
  import voiceCallIcon from '$src/resources/voiceCall.png'
  import videoCallIcon from '$src/resources/videoCall.png'
  import { callService } from '$src/services/CallService'

  let selectedUser = $state<User | null>(null)
  let messages = $state<DirectMessage[]>([])
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
    webSocketService.on(WebSocketMessageType.RECEIVE_DIRECT_MESSAGE, handleIncomingMessage)
  })

  onDestroy(() => {
    webSocketService.off(WebSocketMessageType.RECEIVE_DIRECT_MESSAGE, handleIncomingMessage)
  })

  async function handleIncomingMessage(data: WebSocketMessage<string>): Promise<void> {
    try {
      const incomingMsg: DirectMessage = JSON.parse(data.payload)

      if (selectedUser && incomingMsg.fromUserId === selectedUser.id) {
        incomingMsg.message = await encryptionService.decryptMessage(incomingMsg.message, true)
        messages = [...messages, incomingMsg]
      }
    } catch (error) {
      console.error('Error handling incoming message:', error)
    }
  }

  async function handleSubmitMessage(event: SubmitEvent): Promise<void> {
    event.preventDefault()

    if (selectedUser && messageInput.trim() && userState.currentUser) {
      const newMessage = await chatService.sendDirectMessage(
        userState.currentUser,
        selectedUser.id,
        messageInput
      )

      if (newMessage) {
        newMessage.message = messageInput
        messages = [...messages, newMessage]
      }
    }

    messageInput = ''
  }

  function startCall(): void {
    if (selectedUser) {
      callService.startCall(null, chatState.selectedUser.id, false, null)
    }
  }

  function handleVideoCall(): void {
    if (selectedUser) {
      console.log('Video call not yet implemented')
    }
  }

  export async function loadMessagesForUser(user: User): Promise<void> {
    if (selectedUser && selectedUser.id === user.id) return

    selectedUser = user

    if (!userState.currentUser) {
      throw new Error('No user logged in')
    }

    const currentUserId = userState.currentUser.id

    try {
      const response = await authenticatedGet(
        `chat_messages/get_chat_history?userId=${currentUserId}&toUserId=${user.id}`
      )

      if (!response.ok) {
        throw new Error(`Request failed with status: ${response.status}`)
      }

      const loadedMessages: DirectMessage[] = await response.json()

      const decryptedMessages = await Promise.all(
        loadedMessages.map(async (message) => {
          try {
            const isRecipient = message.toUserId === currentUserId
            message.message = await encryptionService.decryptMessage(message.message, isRecipient)
            return message
          } catch (decryptError) {
            console.error('Failed to decrypt message:', decryptError)
            message.message = '[Decryption failed]'
            return message
          }
        })
      )

      messages = decryptedMessages
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }
</script>

<div class="chat">
  <div class="chat-header">
    {#if selectedUser}
      <h1 class="username">{selectedUser.username}</h1>
      <div class="call-buttons">
        <button class="call-btn" onclick={startCall} title="Voice call">
          <img src={voiceCallIcon} alt="Voice call" />
        </button>
        <button class="call-btn" onclick={handleVideoCall} title="Video call">
          <img src={videoCallIcon} alt="Video call" />
        </button>
      </div>
    {:else}
      <h1>No user selected</h1>
    {/if}
  </div>

  <MessagesContainer {messages} isDirectMessage={true} bind:messagesContainer />
  <ChatInput selectedContent={!!selectedUser} bind:messageInput onSubmit={handleSubmitMessage} />
</div>

<style>
  .chat {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .chat-header {
    height: 60px;
    background-color: #1a1a1a;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    border-bottom: 1px solid #333;
  }

  h1 {
    margin: 0;
    font-size: 20px;
  }

  .username {
    color: #b47024;
  }

  .call-buttons {
    display: flex;
    gap: 12px;
  }

  .call-btn {
    background: #b47024;
    border: none;
    cursor: pointer;
    padding: 8px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s;
  }

  .call-btn:hover {
    background-color: #2a2a2a;
  }

  .call-btn:active {
    background-color: #3a3a3a;
  }

  .call-btn img {
    width: 24px;
    height: 24px;
    display: block;
  }
</style>
