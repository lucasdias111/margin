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
  import ChannelCallWindow from '$src/components/content/call/ChannelCallWindow.svelte'
  import { spaceState } from '$src/states/SpaceState.svelte'
  import { NotificationSounds } from '$src/utils/NotificationSounds'
  import ConnectionBar from '$src/components/common/messages/ConnectionBar.svelte'
  import type { UnreadConversations } from '$src/interfaces/UnreadCount'
  import { updateState } from '$src/states/UpdateState.svelte'
  import UpdateToast from '$src/components/common/messages/UpdateToast.svelte'
  import { isElectron } from '$src/utils/platformUtils'
  import marginPng from '$src/assets/pics/margin.png'

  let incomingCallPayload = $state<CallOfferPayload | null>(null)
  const ringtone = new Audio(NotificationSounds.INCOMING_CALL)
  ringtone.loop = true

  onMount(() => {
    setup()
    webSocketService.connect()
    webSocketService.onReconnect(resync)
  })

  $effect(() => {
    if (incomingCallPayload) {
      ringtone.currentTime = 0
      ringtone.play().catch(() => {})
    } else {
      ringtone.pause()
      ringtone.currentTime = 0
    }
  })

  $effect(() => {
    if (!isElectron()) return
    const total =
      notificationState.getTotalUnreadDirectMessages() +
      notificationState.getTotalUnreadChannelMessages()
    console.log('[badge] effect fired, total:', total)
    window.api!.setBadgeCount(total)
    applyBadgeIcon(total)
  })

  async function applyBadgeIcon(count: number): Promise<void> {
    console.log('[badge] applyBadgeIcon called, count:', count, 'marginPng:', marginPng)
    const size = 128
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!

    await new Promise<void>((resolve) => {
      const img = new Image()
      img.onload = () => {
        console.log('[badge] base icon loaded')
        ctx.drawImage(img, 0, 0, size, size)
        resolve()
      }
      img.onerror = (e) => {
        console.log('[badge] base icon failed to load:', e)
        resolve()
      }
      img.src = marginPng
    })

    if (count > 0) {
      const r = 22
      const x = size - r - 4
      const y = r + 4
      ctx.fillStyle = '#e83838'
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'white'
      ctx.font = `bold ${count > 9 ? 18 : 22}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(count > 99 ? '99+' : String(count), x, y)
    }

    const dataUrl = count > 0 ? canvas.toDataURL('image/png') : null
    console.log('[badge] sending setAppIcon, hasDataUrl:', dataUrl !== null)
    window.api!.setAppIcon(dataUrl)
  }

  useWebsocketSvelte({
    [WebSocketMessageType.RECEIVE_MESSAGE]: chatService.handleIncomingMessage,
    [WebSocketMessageType.CALL_OFFER]: handleIncomingCallOffer,
    [WebSocketMessageType.CALL_END]: handleRemoteCallEnd,
    [WebSocketMessageType.USER_LOGIN]: (data: WebSocketMessage<User>) =>
      presenceService.setOnline(data.payload.id),
    [WebSocketMessageType.USER_LOGOUT]: (data: WebSocketMessage<User>) =>
      presenceService.setOffline(data.payload.id),
    [WebSocketMessageType.NOTIFICATION]: (data: WebSocketMessage<Notification>) => {
      notificationState.addNotification(data.payload)
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
    [WebSocketMessageType.USER_JOINED_SPACE]: (
      msg: WebSocketMessage<{ spaceId: number; user: User }>
    ) => {
      spaceState.addMemberToSpace(msg.payload.spaceId, msg.payload.user)
    },
    [WebSocketMessageType.CONVERSATION_READ]: (
      msg: WebSocketMessage<{ conversationId: number; readAt: string }>
    ) => {
      chatService.setConversationReadAt(msg.payload.conversationId, msg.payload.readAt)
    },
    [WebSocketMessageType.CONVERSATION_INVITE]: chatService.handleIncomingConversationInvite
  })

  async function setup(): Promise<void> {
    if (isElectron()) {
      window.updater!.onUpdateAvailable((version: string) => {
        updateState.version = version
        updateState.updateAvailable = true
      })

      window.updater!.onUpdateDownloaded(() => {
        updateState.downloading = false
        updateState.updateDownloaded = true
      })

      window.updater!.notifyReady()
    }

    await getCurrentUser()
    await loadUnreadMessages()
    await loadRecentUsers()
    await chatService.loadPendingInvites()
    await notificationService.loadAll()
    await marginService.loadMarginsForUser()
  }

  async function loadUnreadMessages(): Promise<void> {
    notificationState.clearUnreadMessages()
    const response = await authenticatedGet('conversations/unread')
    const unread: UnreadConversations = await response.json()
    notificationService.addIncomingDirectConversations(unread.directConversationIds)
    notificationService.addIncomingChannelConversations(unread.channelUnreads)
  }

  async function loadRecentUsers(): Promise<void> {
    const users = await userService.getRecentChatUsers()
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
    const response = await authenticatedGet(`users/me`)

    const user: User = await response.json()
    userState.setUser(user)
  }

  async function resync(): Promise<void> {
    await loadUnreadMessages()
    await loadRecentUsers()

    if (chatState.currentlySelectedContent === 'private' && chatState.selectedUser) {
      await chatService.loadConversationForUser(chatState.selectedUser, true)
    } else if (chatState.selectedChannel) {
      await chatService.loadConversationForChannel(chatState.selectedChannel, true)
    }
  }
</script>

<div class="window">
  <ConnectionBar />
  <UpdateToast />
  {#if callState.isP2PCall}
    <div class="call-overlay" class:minimized={callState.isMinimized}>
      <CallWindow />
    </div>
  {:else if callState.isGroupCall}
    <div class="call-overlay" class:minimized={callState.isMinimized}>
      <ChannelCallWindow />
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
    flex: 1;
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

  .call-overlay.minimized {
    background: transparent;
    pointer-events: none;
  }
</style>
