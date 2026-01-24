<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { webSocketService } from '$src/services/WebSocketService'
  import { WebSocketMessageType } from '$src/interfaces/WebSocketMessageType'
  import { callState } from '$src/states/CallState.svelte'
  import type {
    CallCandidatePayload,
    CallResponsePayload,
    WebSocketMessage
  } from '$src/interfaces/WebSocketMessages'
  import { callService } from '$src/services/CallService'

  let remoteAudio: HTMLAudioElement | null = null

  onMount(() => {
    if (!callState.activeCall) return

    const { userId, isIncoming, offer } = callState.activeCall

    callService.onRemoteStream((stream) => {
      if (remoteAudio) {
        remoteAudio.srcObject = stream
        remoteAudio.play().catch((err) => console.error('Error playing audio:', err))
      }
    })

    webSocketService.on(WebSocketMessageType.CALL_RESPONSE, handleCallResponse)
    webSocketService.on(WebSocketMessageType.CALL_CANDIDATE, handleIceCandidate)

    if (isIncoming && offer) {
      callService.answerCall(userId, offer)
    } else {
      callService.initiateCall(userId)
    }
  })

  onDestroy(() => {
    webSocketService.off(WebSocketMessageType.CALL_RESPONSE, handleCallResponse)
    webSocketService.off(WebSocketMessageType.CALL_CANDIDATE, handleIceCandidate)
    callService.cleanup()
  })

  async function handleCallResponse(data: WebSocketMessage<CallResponsePayload>): Promise<void> {
    await callService.handleCallResponse(data)
  }

  async function handleIceCandidate(data: WebSocketMessage<CallCandidatePayload>): Promise<void> {
    const { candidate, sdpMid, sdpMLineIndex, usernameFragment } = data.payload!

    await callService.handleIceCandidate({
      candidate,
      sdpMid,
      sdpMLineIndex,
      usernameFragment
    })
  }

  function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  function endCall(): void {
    callService.endCall(false)
  }
</script>

{#if callState.activeCall}
  <div class="call-window">
    <div class="call-header">
      <h2>Call with {callState.activeCall.userId}</h2>
    </div>

    <div class="call-content">
      <div class="user-avatar">
        <div class="avatar-circle">
          {callState.activeCall.userId}
        </div>
      </div>

      <div class="call-info">
        {#if callState.status === 'connecting'}
          <p class="status connecting">Connecting...</p>
        {:else if callState.status === 'connected'}
          <p class="status connected">Connected</p>
          <p class="duration">{formatDuration(callState.duration)}</p>
        {:else}
          <p class="status ended">Call Ended</p>
        {/if}
      </div>
    </div>

    <div class="call-controls">
      <button class="end-call-btn" onclick={endCall}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
          />
          <line x1="18" y1="6" x2="6" y2="18" />
        </svg>
        End Call
      </button>
    </div>

    <audio bind:this={remoteAudio} autoplay></audio>
  </div>
{/if}

<style>
  .call-window {
    width: 100vw;
    height: 100vh;
    background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
    display: flex;
    flex-direction: column;
    color: white;
  }

  .call-header {
    padding: 20px;
    text-align: center;
    border-bottom: 1px solid #333;
  }

  .call-header h2 {
    margin: 0;
    font-size: 24px;
    color: #b47024;
  }

  .call-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 30px;
  }

  .user-avatar {
    display: flex;
    justify-content: center;
  }

  .avatar-circle {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background: #b47024;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 48px;
    font-weight: bold;
    color: white;
    box-shadow: 0 4px 20px rgba(180, 112, 36, 0.3);
  }

  .call-info {
    text-align: center;
  }

  .status {
    margin: 0 0 10px 0;
    font-size: 20px;
    font-weight: 500;
  }

  .status.connecting {
    color: #ffa500;
    animation: pulse 1.5s ease-in-out infinite;
  }

  .status.connected {
    color: #4caf50;
  }

  .status.ended {
    color: #999;
  }

  .duration {
    margin: 0;
    font-size: 32px;
    font-weight: 300;
    color: #b47024;
  }

  .call-controls {
    padding: 40px;
    display: flex;
    justify-content: center;
  }

  .end-call-btn {
    background: #dc3545;
    border: none;
    color: white;
    padding: 16px 32px;
    border-radius: 50px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 10px;
    transition: all 0.2s;
    box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3);
  }

  .end-call-btn:hover {
    background: #c82333;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(220, 53, 69, 0.4);
  }

  .end-call-btn:active {
    transform: translateY(0);
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.6;
    }
  }
</style>
