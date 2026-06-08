<script lang="ts">
  import { onMount } from 'svelte'
  import Sidebar from '$src/components/content/sidebar/Sidebar.svelte'
  import ContentWindow from '$src/components/content/Content.svelte'
  import type { User } from '$src/interfaces/User'
  import { authenticatedGet } from '$src/services/api'
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
  import Navigation from '$src/components/content/Navigation.svelte'
  import ManageWindow from '$src/components/content/manage/ManageWindow.svelte'
  import { useWebsocketSvelte } from '$src/composables/useWebsocket.svelte'
  import { chatService } from '$src/services/ChatService'
  import { webSocketService } from '$src/services/WebSocketService'
  import { usersService } from '$src/services/UsersService'
  import { presenceService } from '$src/services/PrecenseService.js'
  import NoMarginEmptyState from '$src/components/content/margin/NoMarginEmptyState.svelte'
  import { encryptionService } from '$src/services/EncryptionService'
  import { marginService } from '$src/services/MarginService'
  import IncomingCallModal from '$src/components/content/call/modal/IncomingCallModal.svelte'
  import type { Notification } from '$src/interfaces/Notification'
  import Notifications from '$src/components/content/notification/Notifications.svelte'
  import ChannelCallWindow from '$src/components/content/call/ChannelCallWindow.svelte'
  import { NotificationSounds } from '$src/utils/NotificationSounds'
  import ConnectionBar from '$src/components/common/messages/ConnectionBar.svelte'
  import type { UnreadConversations } from '$src/interfaces/UnreadCount'
  import UpdateToast from '$src/components/common/messages/UpdateToast.svelte'
  import { isElectron } from '$src/utils/platformUtils'
  import { channelService } from '$src/services/ChannelService'
  import { updateService } from '$src/services/UpdateService'
  import { View } from '$src/interfaces/View'
  import { navigationState } from '$src/states/NavigationState.svelte'
  import { marginState } from '$src/states/MarginState.svelte'
  import { spaceService } from '$src/services/SpaceService'
  import { sessionHandler } from '$src/handlers/SessionHandler'
  import { conversationsState } from '$src/states/ConversationsState.svelte'
  import { subscriptionState } from '$src/states/SubscriptionState.svelte'
  import type { Subscription } from '$src/interfaces/Subscription'
  import OnboardingOverlay from '$src/components/content/onboarding/OnboardingOverlay.svelte'

  const MOBILE_BREAKPOINT = 768
  let onboardingReady = $state(false)
  let viewportWidth = $state(typeof window !== 'undefined' ? window.innerWidth : 1024)
  const showOnboarding = $derived(
    onboardingReady && (isElectron() || viewportWidth > MOBILE_BREAKPOINT)
  )

  let incomingCallPayload = $state<CallOfferPayload | null>(null)
  const ringtone = new Audio(NotificationSounds.INCOMING_CALL)
  ringtone.loop = true

  const hasSelection = $derived(
    navigationState.view === View.Private
      ? !!navigationState.selectedUser
      : navigationState.view === View.Margin
        ? !!navigationState.selectedChannel
        : false
  )

  onMount(() => {
    setup().then(() => (onboardingReady = true))
    webSocketService.connect()
    webSocketService.onReconnect(resync)

    const onViewportResize = (): void => {
      viewportWidth = window.innerWidth
    }
    window.addEventListener('resize', onViewportResize)

    if (isElectron()) {
      window.electronAPI?.onUserStatusChange((status) => {
        if (status === 'active') resync()
      })
    }

    return () => window.removeEventListener('resize', onViewportResize)
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
      notificationService.totalUnreadDirectMessages() +
      notificationService.totalUnreadChannelMessages()
    window.api!.setBadgeCount(total)
  })

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
      channelService.updateVoiceParticipant(msg.payload.channelId, msg.payload.user, true)
    },
    [WebSocketMessageType.USER_LEFT_VOICE]: (
      msg: WebSocketMessage<ChannelVoiceParticipantPayload>
    ) => {
      channelService.updateVoiceParticipant(msg.payload.channelId, msg.payload.user, false)
    },
    [WebSocketMessageType.USER_JOINED_SPACE]: (
      msg: WebSocketMessage<{ spaceId: number; user: User }>
    ) => {
      spaceService.addMemberToSpace(msg.payload.spaceId, msg.payload.user)
    },
    [WebSocketMessageType.CONVERSATION_READ]: (
      msg: WebSocketMessage<{ conversationId: number; readAt: string }>
    ) => {
      chatService.setConversationReadAt(msg.payload.conversationId, msg.payload.readAt)
    },
    [WebSocketMessageType.CONVERSATION_INVITE]: chatService.handleIncomingConversationInvite,
    [WebSocketMessageType.CONVERSATION_INVITE_ACCEPTED]:
      chatService.handleConversationInviteAccepted,
    [WebSocketMessageType.SUBSCRIPTION_UPDATED]: (msg: WebSocketMessage<Subscription>) => {
      subscriptionState.set(msg.payload)
    }
  })

  async function setup(): Promise<void> {
    if (isElectron()) {
      window.updater!.onUpdateAvailable((version: string) => {
        updateService.setVersion(version)
        updateService.setUpdateAvailable(true)
      })

      window.updater!.onUpdateDownloaded(() => {
        updateService.setIsDownloading(false)
        updateService.hasUpdateDownloaded(true)
      })

      window.updater!.onUpdateProgress((percent: number) => {
        updateService.setProgress(percent)
      })

      window.updater!.onUpdateError((message: string) => {
        updateService.setError(message)
      })

      window.updater!.notifyReady()
    }

    await sessionHandler.getCurrentUser()
    await loadUnreadMessages()
    await loadRecentUsers()
    await chatService.loadPendingInvites()
    await notificationService.loadAll()
    await marginService.loadMarginsForUser()
  }

  async function loadUnreadMessages(): Promise<void> {
    const response = await authenticatedGet('conversations/unread')
    const unread: UnreadConversations = await response.json()

    for (const id of unread.directConversationIds) {
      conversationsState.markUnread(id)
    }

    for (const ch of unread.channelUnreads) {
      if (!conversationsState.byId.has(ch.conversationId)) {
        conversationsState.byId.set(ch.conversationId, {
          id: ch.conversationId,
          type: 'CHANNEL',
          channelId: -1,
          name: '',
          createdAt: new Date().toISOString()
        })
      }
      conversationsState.markUnread(ch.conversationId)
      conversationsState.setMarginForConversation(ch.conversationId, ch.marginId)
    }
  }

  async function loadRecentUsers(): Promise<void> {
    const users = await usersService.getRecentChatUsers()
    const decryptedUsers = await Promise.all(
      users.map(async (recentUser) => {
        if (!recentUser.lastMessage) return recentUser
        try {
          recentUser.lastMessage = await encryptionService.decryptMessage(
            recentUser.lastMessage,
            recentUser.lastMessageIncoming
          )
        } catch {
          recentUser.lastMessage = '[Unable to decrypt]'
        }
        return recentUser
      })
    )
    usersService.loadRecentConversations(decryptedUsers)
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

  const RESYNC_COOLDOWN_MS = 2000
  let lastResyncAt = 0

  async function resync(): Promise<void> {
    const now = Date.now()
    if (now - lastResyncAt < RESYNC_COOLDOWN_MS) return
    lastResyncAt = now

    await loadUnreadMessages()
    await loadRecentUsers()

    if (navigationState.view === View.Private && navigationState.selectedUser) {
      await chatService.loadConversationForUser(navigationState.selectedUser, true)
    } else if (navigationState.selectedChannel) {
      await chatService.loadConversationForChannel(navigationState.selectedChannel, true)
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
  {#if navigationState.view === View.Manage}
    <ManageWindow />
  {:else if navigationState.view === View.Margin && !marginState.isMemberOfAnyMargins}
    <NoMarginEmptyState />
  {:else if navigationState.view === View.Notifications}
    <Notifications />
  {:else}
    <div class="sidebar-pane" class:mobile-hidden={hasSelection}>
      <Sidebar />
    </div>
    <div class="content-pane" class:mobile-hidden={!hasSelection}>
      <ContentWindow />
    </div>
  {/if}
  <IncomingCallModal payload={incomingCallPayload} onAccept={acceptCall} onDecline={declineCall} />
  {#if showOnboarding}
    <OnboardingOverlay />
  {/if}
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

  .sidebar-pane,
  .content-pane {
    display: contents;
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

  @media (max-width: 768px) {
    .window {
      flex-direction: column;
      gap: 0;
      padding: 0 0 64px;
    }

    .mobile-hidden {
      display: none !important;
    }
  }
</style>
