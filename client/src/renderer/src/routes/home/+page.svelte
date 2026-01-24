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

  let content: ContentWindow

  onMount(() => {
    getCurrentUser()
    webSocketService.connect()
    webSocketService.on(WebSocketMessageType.CALL_OFFER, handleIncomingCallOffer)
    webSocketService.on(WebSocketMessageType.CALL_END, handleRemoteCallEnd)
  })

  onDestroy(() => {
    webSocketService.disconnect()
    webSocketService.off(WebSocketMessageType.CALL_OFFER, handleIncomingCallOffer)
    webSocketService.off(WebSocketMessageType.CALL_END, handleRemoteCallEnd)
  })

  function handleIncomingCallOffer(message: WebSocketMessage<CallOfferPayload>): void {
    const payload = message.payload
    const accept = confirm(`Incoming call from ${payload.callerId}. Accept?`)

    if (accept) {
      const offer = {
        type: 'offer' as const,
        sdp: payload.sdp
      }

      callService.startCall(payload.callId, payload.callerId, true, offer)
    } else {
      console.log('Call rejected')
    }
  }

  function handleRemoteCallEnd(): void {
    console.log('Remote user ended the call')
    callService.endCall()
  }

  async function getCurrentUser(): Promise<void> {
    try {
      const response = await authenticatedGet(`users/me`)

      if (!response.ok) {
        throw new Error(`Request failed with status: ${response.status}`)
      }

      const user: User = await response.json()
      userState.setUser(user)
      console.log('Current user loaded:', user)
    } catch (error) {
      console.error('Error getting current user:', error)
    }
  }
</script>

<div class="app">
  <Header />
  <div class="content">
    <Sidebar />
    <ContentWindow bind:this={content} />
  </div>
</div>

{#if callState.activeCall}
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
