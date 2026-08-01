<script lang="ts">
  import { onMount } from 'svelte'
  import Sidebar from '$src/components/content/sidebar/Sidebar.svelte'
  import ContentWindow from '$src/components/content/Content.svelte'
  import { authenticatedGet } from '$src/services/api'
  import { callState } from '$src/states/CallState.svelte'
  import CallWindow from '$src/components/content/call/CallWindow.svelte'
  import { callService } from '$src/services/call/CallService'
  import { channelCallService } from '$src/services/call/ChannelCallService'
  import { notificationService } from '$src/services/NotificationService'
  import Navigation from '$src/components/content/Navigation.svelte'
  import ManageWindow from '$src/components/content/manage/ManageWindow.svelte'
  import { registerWebSocketHandlers } from '$src/services/websocket/registerHandlers'
  import { messageLoaderService } from '$src/services/MessageLoaderService'
  import { inviteService } from '$src/services/ConversationInviteService'
  import { webSocketService } from '$src/services/websocket/WebSocketService'
  import { usersService } from '$src/services/UsersService'
  import NoMarginEmptyState from '$src/components/content/margin/NoMarginEmptyState.svelte'
  import { encryptionService } from '$src/services/EncryptionService'
  import { marginService } from '$src/services/MarginService'
  import IncomingCallModal from '$src/components/content/call/modal/IncomingCallModal.svelte'
  import Notifications from '$src/components/content/notification/Notifications.svelte'
  import { threadService } from '$src/services/ThreadService'
  import { threadsState } from '$src/states/ThreadsState.svelte'
  import ChannelCallWindow from '$src/components/content/call/ChannelCallWindow.svelte'
  import { NotificationSounds } from '$src/utils/NotificationSounds'
  import ConnectionBar from '$src/components/common/messages/ConnectionBar.svelte'
  import type { UnreadConversations } from '$src/interfaces/UnreadCount'
  import UpdateToast from '$src/components/common/messages/UpdateToast.svelte'
  import { isElectron } from '$src/utils/platformUtils'
  import { updateService } from '$src/services/UpdateService'
  import { View } from '$src/interfaces/View'
  import { navigationState } from '$src/states/NavigationState.svelte'
  import { marginState } from '$src/states/MarginState.svelte'
  import { sessionHandler } from '$src/handlers/SessionHandler'
  import { sessionState } from '$src/states/SessionState.svelte'
  import { conversationsState } from '$src/states/ConversationsState.svelte'
  import { incomingCallState } from '$src/states/IncomingCallState.svelte'
  import OnboardingOverlay from '$src/components/content/onboarding/OnboardingOverlay.svelte'

  const MOBILE_BREAKPOINT = 768
  let onboardingReady = $state(false)
  let viewportWidth = $state(typeof window !== 'undefined' ? window.innerWidth : 1024)
  const showOnboarding = $derived(
    onboardingReady && (isElectron() || viewportWidth > MOBILE_BREAKPOINT)
  )

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
    const unregisterHandlers = registerWebSocketHandlers()
    const unsubscribeReconnect = webSocketService.onLifecycle('reconnected', resync)

    setup().then(() => (onboardingReady = true))
    webSocketService.connect()

    const onViewportResize = (): void => {
      viewportWidth = window.innerWidth
    }
    window.addEventListener('resize', onViewportResize)

    if (isElectron()) {
      window.electronAPI?.onUserStatusChange((status) => {
        if (status === 'active') resync()
      })
    }

    return () => {
      window.removeEventListener('resize', onViewportResize)
      unsubscribeReconnect()
      unregisterHandlers()
    }
  })

  $effect(() => {
    if (incomingCallState.isRinging) {
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
    await inviteService.loadPendingInvites()
    await inviteService.loadSentInvites()
    await notificationService.loadAll()
    await marginService.loadMarginsForUser()
    await threadService.loadInbox()
  }

  async function loadUnreadMessages(): Promise<void> {
    const response = await authenticatedGet('conversations/unread')
    const unread: UnreadConversations = await response.json()

    for (const id of unread.directConversationIds) {
      conversationsState.markUnread(id)
    }

    for (const id of unread.groupConversationIds ?? []) {
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

    for (const id of unread.threadConversationIds ?? []) {
      threadsState.markUnread(id)
    }
  }

  async function loadRecentUsers(): Promise<void> {
    const users = await usersService.getRecentChatUsers()
    const decryptedUsers = await Promise.all(
      users.map(async (recentUser) => {
        if (!recentUser.lastMessage) return recentUser
        const conv = recentUser.conversation
        if (!('encrypted' in conv) || !conv.encrypted) return recentUser
        try {
          if (conv.type === 'GROUP') {
            recentUser.lastMessage = await encryptionService.decryptGroupMessage(
              recentUser.lastMessage,
              sessionState.currentUser.id
            )
          } else {
            recentUser.lastMessage = await encryptionService.decryptMessage(
              recentUser.lastMessage,
              recentUser.lastMessageIncoming
            )
          }
        } catch {
          recentUser.lastMessage = '[Unable to decrypt]'
        }
        return recentUser
      })
    )
    usersService.loadRecentConversations(decryptedUsers)
  }

  function acceptCall(): void {
    const offer = incomingCallState.offer
    if (!offer) return
    incomingCallState.clearOffer()
    callService.startCall(offer.callId, offer.caller, true, false, {
      type: 'offer' as const,
      sdp: offer.sdp
    })
  }

  function declineCall(): void {
    const offer = incomingCallState.offer
    if (!offer) return
    callService.rejectCall(offer.callId, offer.caller.id)
    incomingCallState.clearOffer()
  }

  function acceptChannelCallInvite(): void {
    const invite = incomingCallState.channelInvite
    incomingCallState.clearChannelInvite()
    if (!invite) return
    channelCallService.joinVoiceChannel(invite.channelId)
  }

  const RESYNC_COOLDOWN_MS = 2000
  let lastResyncAt = 0

  async function resync(): Promise<void> {
    const now = Date.now()
    if (now - lastResyncAt < RESYNC_COOLDOWN_MS) return
    lastResyncAt = now

    await loadUnreadMessages()
    await loadRecentUsers()
    await threadService.loadInbox()

    if (navigationState.view === View.Private && navigationState.selectedUser) {
      await messageLoaderService.loadConversationForUser(navigationState.selectedUser, true)
    } else if (navigationState.selectedChannel) {
      await messageLoaderService.loadConversationForChannel(navigationState.selectedChannel, true)
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
  {#if incomingCallState.offer}
    <IncomingCallModal
      caller={incomingCallState.offer.caller}
      onAccept={acceptCall}
      onDecline={declineCall}
    />
  {:else if incomingCallState.channelInvite}
    <IncomingCallModal
      caller={incomingCallState.channelInvite.fromUser}
      subtitle="Channel call invite"
      channelName={incomingCallState.channelInvite.channelName}
      acceptLabel="Join"
      onAccept={acceptChannelCallInvite}
      onDecline={() => incomingCallState.clearChannelInvite()}
    />
  {/if}
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
