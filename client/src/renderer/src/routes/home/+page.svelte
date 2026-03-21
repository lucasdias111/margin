<script lang="ts">
  import { onMount } from 'svelte'
  import Sidebar from '$src/components/content/sidebar/Sidebar.svelte'
  import ContentWindow from '$src/components/content/Content.svelte'
  import type { User } from '$src/interfaces/User'
  import { authenticatedGet } from '$src/services/api'
  import { userState } from '$src/states/UserState.svelte'
  import { WebSocketMessageType } from '$src/interfaces/WebSocketMessageType'
  import { callState } from '$src/states/CallState.svelte'
  import CallWindow from '$src/components/content/call/CallWindow.svelte'
  import { callService } from '$src/services/call/CallService'
  import type {
    CallOfferPayload,
    ChannelVoiceParticipantPayload,
    WebSocketMessage
  } from '$src/interfaces/WebSocketMessages'
  import { notificationService } from '$src/services/NotificationService'
  import type { UnreadCount } from '$src/interfaces/UnreadCount'
  import { notificationState } from '$src/states/NotificationState.svelte'
  import { chatState } from '$src/states/ChatState.svelte'
  import Navigation from '$src/components/content/Navigation.svelte'
  import ManageWindow from '$src/components/content/manage/ManageWindow.svelte'
  import { useWebsocketSvelte } from '$src/composables/useWebsocket.svelte'
  import { chatService } from '$src/services/ChatService'
  import { webSocketService } from '$src/services/WebSocketService'
  import { userService } from '$src/services/UserService'
  import { presenceService } from '$src/services/PrecenseService.js'
  import { userListState } from '$src/states/UserListState.svelte'
  import NoMarginEmptyState from '$src/components/content/margin/NoMarginEmptyState.svelte'
  import { encryptionService } from '$src/services/EncryptionService'
  import { marginService } from '$src/services/MarginService'
  import IncomingCallModal from '$src/components/content/call/modal/IncomingCallModal.svelte'
  import type { Notification } from '$src/interfaces/Notification'
  import Notifications from '$src/components/content/notification/Notifications.svelte'
  import type { Margin } from '$src/interfaces/Margin'
  import SFUCallWindow from '$src/components/content/call/SFUCallWindow.svelte'
  import { spaceState } from '$src/states/SpaceState.svelte'

  let incomingCallPayload = $state<CallOfferPayload | null>(null)

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
      presenceService.setOffline(data.payload.id),
    [WebSocketMessageType.NOTIFICATION]: (data: WebSocketMessage<Notification>) =>
      notificationState.incrementUnseenAnnouncements(data.payload.marginId),
    [WebSocketMessageType.USER_ADDED_TO_MARGIN]: (data: WebSocketMessage<Margin>) => {
      marginService.addNewMargin(data.payload)
      notificationState.incrementUnseenAnnouncements(data.payload.marginId)
    },
    [WebSocketMessageType.CALL_NO_ANSWER]: () => (incomingCallPayload = null),
    [WebSocketMessageType.USER_JOINED_VOICE]: (
      msg: WebSocketMessage<ChannelVoiceParticipantPayload>
    ) => {
      spaceState.updateVoiceParticipant(msg.payload.channelId, msg.payload.user, true)
    },
    [WebSocketMessageType.USER_LEFT_VOICE]: (
      msg: WebSocketMessage<ChannelVoiceParticipantPayload>
    ) => {
      spaceState.updateVoiceParticipant(msg.payload.channelId, msg.payload.user, false)
    },
  })

  async function setup(): Promise<void> {
    await getCurrentUser()
    await loadUnreadMessages()
    await loadRecentUsers()
    await notificationState.loadUnseenAnnouncementCounts()
    await marginService.getMargins().then((margins) => {
      chatState.margins = margins
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
    incomingCallPayload = message.payload
  }

  function acceptCall(): void {
    if (!incomingCallPayload) return
    const p = incomingCallPayload
    incomingCallPayload = null
    callService.startCall(p.callId, p.caller, true, false, { type: 'offer' as const, sdp: p.sdp })
  }

  function declineCall(): void {
    callService.rejectCall(incomingCallPayload.callId, incomingCallPayload.caller.id)
    incomingCallPayload = null
  }

  function handleRemoteCallEnd(): void {
    callService.endCall(true)
  }

  async function getCurrentUser(): Promise<void> {
    const response = await authenticatedGet(`api/users/me`)

    const user: User = await response.json()
    userState.setUser(user)
  }
</script>

<div class="window">
  {#if callState.isP2PCall}
    <div class="call-overlay" class:minimized={callState.isMinimized}>
      <CallWindow />
    </div>
  {:else if callState.isGroupCall}
    <div class="call-overlay" class:minimized={callState.isMinimized}>
      <SFUCallWindow />
    </div>
  {/if}
  <Navigation />
  {#if chatState.currentlySelectedContent === 'manage'}
    <ManageWindow />
  {:else if chatState.currentlySelectedContent === 'margin' && !chatState.hasMargin}
    <NoMarginEmptyState />
  {:else if chatState.currentlySelectedContent === 'notifications'}
    <Notifications />
  {:else}
    <Sidebar />
    <ContentWindow />
  {/if}
  <IncomingCallModal payload={incomingCallPayload} onAccept={acceptCall} onDecline={declineCall} />
</div>

<style>
  .window {
    position: relative;
    display: flex;
    height: 95vh;
    padding: 10px;
    box-sizing: border-box;
    gap: 10px;
    background-color: #f2eee8;
  }

  .call-overlay {
    position: absolute;
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

  .call-overlay {
    position: absolute;
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

  .call-overlay.minimized {
    background: transparent;
    pointer-events: none;
  }
</style>
