<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import Sidebar from '$src/components/sidebar/Sidebar.svelte'
  import ContentWindow from '$src/components/content/Content.svelte'
  import Header from '$src/components/header/MainHeader.svelte'
  import type { User } from '$src/interfaces/User'
  import { webSocketService } from '$src/services/WebSocketService'
  import { authenticatedGet } from '$src/services/api'
  import { userState } from '$src/states/UserState.svelte'
  import { WebSocketMessageType } from '$src/interfaces/WebSocketMessageType'
  import { callState } from '$src/states/CallState.svelte'
  import CallWindow from '$src/components/call/CallWindow.svelte'
  import { callService } from '$src/services/CallService'
  import type { CallOfferPayload, WebSocketMessage } from '$src/interfaces/WebSocketMessages'
  import type { Message } from '$src/interfaces/Messages'
  import { notificationService } from '$src/services/NotificationService'
  import type { UnreadCount } from '$src/interfaces/UnreadCount'
  import { notificationState } from '$src/states/NotificationState.svelte'
  import { chatState } from '$src/states/ChatState.svelte'

  onMount(() => {
    setup()
    webSocketService.connect()
    webSocketService.on(WebSocketMessageType.CALL_OFFER, handleIncomingCallOffer)
    webSocketService.on(WebSocketMessageType.CALL_END, handleRemoteCallEnd)
    webSocketService.on(WebSocketMessageType.RECEIVE_MESSAGE, handleIncomingMessage)
  })

  onDestroy(() => {
    webSocketService.disconnect()
    webSocketService.off(WebSocketMessageType.CALL_OFFER, handleIncomingCallOffer)
    webSocketService.off(WebSocketMessageType.CALL_END, handleRemoteCallEnd)
    webSocketService.off(WebSocketMessageType.RECEIVE_MESSAGE, handleIncomingMessage)
  })

  async function setup(): Promise<void> {
    await getCurrentUser()
    await loadUnreadMessages()
  }

  async function loadUnreadMessages(): Promise<void> {
    notificationState.clearUnreadMessages()

    const response = await authenticatedGet(`api/conversations/unread`)

    if (!response.ok) {
      throw new Error('Failed to fetch unread messages')
    }

    const unreadCounts: UnreadCount[] = await response.json()

    const dms = unreadCounts.filter((count) => count.unreadDmsCount > 0)
    const channels = unreadCounts.filter((count) => count.unreadChannelsCount > 0)

    notificationService.addIncomingDirectMessages(dms)
    notificationService.addIncomingChannelMessages(channels)
  }

  function handleIncomingMessage(data: WebSocketMessage<Message>): void {
    if (!chatState.selectedUser) {
      return
    }
    notificationService.handleIncomingMessage(data.payload)
  }

  function handleIncomingCallOffer(message: WebSocketMessage<CallOfferPayload>): void {
    const payload = message.payload
    const accept = confirm(`Incoming call from ${payload.callerId}. Accept?`)

    if (accept) {
      const offer = {
        type: 'offer' as const,
        sdp: payload.sdp
      }

      callService.startCall(payload.callId, payload.callerId, true, offer)
    }
  }

  function handleRemoteCallEnd(): void {
    console.log('Remote user ended the call')
    callService.endCall(true)
  }

  async function getCurrentUser(): Promise<void> {
    const response = await authenticatedGet(`api/users/me`)

    const user: User = await response.json()
    userState.setUser(user)
    console.log('Current user loaded:', user)
  }
</script>

<div class="app">
  <Header />
  <div class="content">
    <Sidebar />
    <ContentWindow />
  </div>
</div>

{#if callState.isP2PCall}
  <div class="call-overlay">
    <CallWindow />
  </div>
{/if}

<style>
  .app {
    height: 97vh;
    display: flex;
    flex-direction: column;
  }

  .content {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  .call-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.95);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
