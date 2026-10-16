<script lang="ts">
  import { onMount } from 'svelte'
  import Sidebar from '$src/components/content/sidebar/Sidebar.svelte'
  import ContentWindow from '$src/components/content/Content.svelte'
  import Navigation from '$src/components/content/Navigation.svelte'
  import ManageWindow from '$src/components/content/manage/ManageWindow.svelte'
  import Notifications from '$src/components/content/notification/Notifications.svelte'
  import NoMarginEmptyState from '$src/components/content/margin/NoMarginEmptyState.svelte'
  import OnboardingOverlay from '$src/components/content/onboarding/OnboardingOverlay.svelte'
  import CallWindow from '$src/components/content/call/CallWindow.svelte'
  import ChannelCallWindow from '$src/components/content/call/ChannelCallWindow.svelte'
  import IncomingCallLayer from '$src/components/content/call/IncomingCallLayer.svelte'
  import ConnectionBar from '$src/components/common/messages/ConnectionBar.svelte'
  import { useDesktopIntegration } from '$src/composables/useDesktopIntegration.svelte'
  import { bootstrapService } from '$src/services/BootstrapService'
  import { registerWebSocketHandlers } from '$src/services/websocket/registerHandlers'
  import { webSocketService } from '$src/services/websocket/WebSocketService'
  import { View } from '$src/interfaces/View'
  import { callState } from '$src/states/CallState.svelte'
  import { marginState } from '$src/states/MarginState.svelte'
  import { navigationState } from '$src/states/NavigationState.svelte'
  import { viewportState } from '$src/states/ViewportState.svelte'
  import { isDesktopShell } from '$src/utils/platformUtils'
  import PageTransition from '$src/components/common/motion/PageTransition.svelte'

  let bootstrapped = $state(false)
  const showOnboarding = $derived(bootstrapped && (isDesktopShell() || !viewportState.isMobile))

  const resync = (): Promise<void> => bootstrapService.resync()

  useDesktopIntegration(resync)

  onMount(() => {
    const unregisterHandlers = registerWebSocketHandlers()
    const unsubscribeReconnect = webSocketService.onLifecycle('reconnected', resync)
    const unobserveViewport = viewportState.observe()

    bootstrapService.loadInitialData().then(() => (bootstrapped = true))
    webSocketService.connect()

    return () => {
      unobserveViewport()
      unsubscribeReconnect()
      unregisterHandlers()
    }
  })
</script>

<PageTransition>
  <div class="window">
    <ConnectionBar />
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
      <div class="sidebar-pane" class:mobile-hidden={navigationState.hasSelection}>
        <Sidebar />
      </div>
      <div class="content-pane" class:mobile-hidden={!navigationState.hasSelection}>
        <ContentWindow />
      </div>
    {/if}
    <IncomingCallLayer />
    {#if showOnboarding}
      <OnboardingOverlay />
    {/if}
  </div>
</PageTransition>

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
