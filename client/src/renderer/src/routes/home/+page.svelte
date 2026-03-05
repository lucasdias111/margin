<script lang="ts">
  import { onMount } from 'svelte'
  import Sidebar from '$src/components/sidebar/Sidebar.svelte'
  import ContentWindow from '$src/components/content/Content.svelte'
  import Header from '$src/components/common/header/MainHeader.svelte'
  import type { User } from '$src/interfaces/User'
  import { authenticatedGet } from '$src/services/api'
  import { userState } from '$src/states/UserState.svelte'
  import { WebSocketMessageType } from '$src/interfaces/WebSocketMessageType'
  import { callState } from '$src/states/CallState.svelte'
  import CallWindow from '$src/components/call/CallWindow.svelte'
  import { callService } from '$src/services/CallService'
  import type { CallOfferPayload, WebSocketMessage } from '$src/interfaces/WebSocketMessages'
  import { notificationService } from '$src/services/NotificationService'
  import type { UnreadCount } from '$src/interfaces/UnreadCount'
  import { notificationState } from '$src/states/NotificationState.svelte'
  import { chatState } from '$src/states/ChatState.svelte'
  import Navigation from '$src/components/sidebar/Navigation.svelte'
  import ManageWindow from '$src/components/manage/ManageWindow.svelte'
  import { useWebsocketSvelte } from '$src/composables/useWebsocket.svelte'
  import { chatService } from '$src/services/ChatService'
  import { webSocketService } from '$src/services/WebSocketService'
  import { userService } from '$src/services/UserService'
  import { presenceService } from '$src/services/PrecenseService.js'
  import { userListState } from '$src/states/UserListState.svelte'
  import NoMarginEmptyState from '$src/components/content/NoMarginEmptyState.svelte'
  import { encryptionService } from '$src/services/EncryptionService'
  import { marginService } from '$src/services/MarginService'

  onMount(() => {
    setup()
    webSocketService.connect()
  })

  useWebsocketSvelte({
    [WebSocketMessageType.RECEIVE_MESSAGE]: chatService.handleIncomingMessage,
    [WebSocketMessageType.CALL_OFFER]: handleIncomingCallOffer,
    [WebSocketMessageType.CALL_END]: handleRemoteCallEnd,
    [WebSocketMessageType.USER_LOGIN]: (data: WebSocketMessage<User>) =>
      presenceService.setOnline(data.payload.id),
    [WebSocketMessageType.USER_LOGOUT]: (data: WebSocketMessage<User>) =>
      presenceService.setOffline(data.payload.id)
  })

  async function setup(): Promise<void> {
    await getCurrentUser()
    await loadUnreadMessages()
    await loadRecentUsers()
    await marginService.getMargins().then((margins) => {
      if (margins.length === 0) {
        chatState.hasMargin = false
      } else {
        chatState.selectMargin(margins[0])
      }
    })
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

  async function loadRecentUsers(): Promise<void> {
    const users = await userService.getRecentChatUsers(userState.currentUser.id)
    const decryptedUsers = await Promise.all(
      users.map(async (recentUser) => {
        if (!recentUser.lastMessage) return recentUser
        recentUser.lastMessage = await encryptionService.decryptMessage(
          recentUser.lastMessage,
          recentUser.lastMessageIncoming
        )
        return recentUser
      })
    )
    userListState.setUsers(decryptedUsers)
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
  <div class="window">
    <Navigation />
    {#if chatState.currentlySelectedContent === 'manage'}
      <ManageWindow />
    {:else if chatState.currentlySelectedContent === 'margin' && !chatState.hasMargin}
      <NoMarginEmptyState />
    {:else}
      <Sidebar />
      <ContentWindow />
    {/if}
  </div>
</div>

{#if callState.isP2PCall}
  <div class="call-overlay">
    <CallWindow />
  </div>
{/if}

<style>
  .app {
    height: 95vh;
    display: flex;
    flex-direction: column;
    background-color: rgb(232, 234, 251);
  }

  .call-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: #2d2d2d;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .window {
    display: flex;
    height: 100%;
    padding: 10px;
    box-sizing: border-box;
    gap: 10px;
  }
</style>
