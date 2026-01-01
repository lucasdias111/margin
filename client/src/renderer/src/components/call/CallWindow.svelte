<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { webSocketService } from '$src/services/WebSocketService'
  import type { WebSocketMessage } from '$src/interfaces/WebSocketMessage'
  import { WebSocketMessageType } from '$src/interfaces/WebSocketMessageType'
  import type { User } from '$src/interfaces/User'

  interface Props {
    selectedUser: User
    isIncoming?: boolean
    offer?: any
    onCallEnd?: () => void
  }

  let { selectedUser, isIncoming = false, offer, onCallEnd }: Props = $props()

  let peerConnection: RTCPeerConnection | null = null
  let localStream: MediaStream | null = null
  let remoteStream: MediaStream | null = null
  let candidateQueue: Array<{
    candidate: string
    sdpMid: string | null
    sdpMLineIndex: number | null
    usernameFragment?: string
  }> = []
  let remoteAudio: HTMLAudioElement | null = null
  let callStatus = $state<'connecting' | 'connected' | 'ended'>('connecting')
  let callDuration = $state(0)
  let durationInterval: number | null = null

  onMount(() => {
    webSocketService.on(WebSocketMessageType.CALL_RESPONSE, handleCallResponse)
    webSocketService.on(WebSocketMessageType.CALL_CANDIDATE, handleIceCandidate)

    if (isIncoming) {
      handleIncomingCall()
    } else {
      initiateCall()
    }
  })

  onDestroy(() => {
    endCall()
    if (durationInterval) clearInterval(durationInterval)
  })

  async function initiateCall(): Promise<void> {
    try {
      const config = {
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      }

      console.log('[Call] Getting local media')
      localStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      peerConnection = new RTCPeerConnection(config)
      remoteStream = new MediaStream()

      setupPeerConnectionHandlers()

      localStream.getTracks().forEach((track) => {
        if (peerConnection && localStream) {
          peerConnection.addTrack(track, localStream)
        }
      })

      console.log('[Call] Creating offer')
      const offer = await peerConnection.createOffer()
      await peerConnection.setLocalDescription(offer)

      webSocketService.send({
        type: WebSocketMessageType.CALL_OFFER,
        toUserId: selectedUser.id,
        message: offer
      })
      console.log('[Call] Offer sent')
    } catch (err) {
      console.error('Error initiating call:', err)
      alert('Failed to start call')
      window.close()
    }
  }

  async function handleIncomingCall(): Promise<void> {
    try {
      console.log('[Call] Handling incoming call')

      const config = {
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      }

      localStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      peerConnection = new RTCPeerConnection(config)
      remoteStream = new MediaStream()

      setupPeerConnectionHandlers()

      localStream.getTracks().forEach((track) => {
        if (peerConnection && localStream) {
          peerConnection.addTrack(track, localStream)
        }
      })

      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer))

      console.log('[Call] Flushing ICE candidate queue')
      for (const candidate of candidateQueue) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
      }
      candidateQueue = []

      console.log('[Call] Creating answer')
      const answer = await peerConnection.createAnswer()
      await peerConnection.setLocalDescription(answer)

      webSocketService.send({
        type: WebSocketMessageType.CALL_RESPONSE,
        toUserId: selectedUser.id,
        message: answer
      })
      console.log('[Call] Answer sent')
    } catch (err) {
      console.error('Error handling incoming call:', err)
      alert('Failed to answer call')
      window.close()
    }
  }

  function setupPeerConnectionHandlers(): void {
    if (!peerConnection) return

    peerConnection.ontrack = (event) => {
      console.log('[Call] Remote track received')
      if (remoteStream) {
        remoteStream.addTrack(event.track)

        // Play audio
        if (remoteAudio) {
          remoteAudio.srcObject = remoteStream
          remoteAudio.play().catch((err) => console.error('Error playing audio:', err))
        }

        // Update call status
        if (callStatus === 'connecting') {
          callStatus = 'connected'
          startCallTimer()
        }
      }
    }

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('[Call] Sending ICE candidate')
        webSocketService.send({
          type: WebSocketMessageType.CALL_CANDIDATE,
          toUserId: selectedUser.id,
          message: event.candidate
        })
      }
    }

    peerConnection.onconnectionstatechange = () => {
      console.log('[Call] Connection state:', peerConnection?.connectionState)
      if (
        peerConnection?.connectionState === 'disconnected' ||
        peerConnection?.connectionState === 'failed' ||
        peerConnection?.connectionState === 'closed'
      ) {
        endCall()
      }
    }
  }

  async function handleCallResponse(data: WebSocketMessage): Promise<void> {
    if (!peerConnection) {
      console.error('No peer connection exists!')
      return
    }

    try {
      console.log('[Call] Received answer')

      const answer = JSON.parse(data.payload)
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer))

      console.log('[Call] Flushing ICE candidate queue')
      for (const candidate of candidateQueue) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
      }
      candidateQueue = []
      console.log('[Call] Call established!')
    } catch (err) {
      console.error('Error handling call response:', err)
    }
  }

  async function handleIceCandidate(data: WebSocketMessage): Promise<void> {
    try {
      const candidate = JSON.parse(data.payload)

      if (!peerConnection) {
        console.log('[Call] Queueing ICE candidate (no peer connection yet)')
        candidateQueue.push(candidate)
        return
      }

      if (peerConnection.remoteDescription) {
        console.log('[Call] Adding ICE candidate immediately')
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
      } else {
        console.log('[Call] Queueing ICE candidate (no remote description yet)')
        candidateQueue.push(candidate)
      }
    } catch (err) {
      console.error('Error handling ICE candidate:', err)
    }
  }

  function startCallTimer(): void {
    durationInterval = setInterval(() => {
      callDuration++
    }, 1000) as unknown as number
  }

  function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  function endCall(): void {
    console.log('[Call] Ending call and cleaning up')

    callStatus = 'ended'

    if (peerConnection) {
      peerConnection.close()
      peerConnection = null
    }

    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop())
      localStream = null
    }

    remoteStream = null
    candidateQueue = []

    webSocketService.send({
      type: WebSocketMessageType.CALL_END,
      toUserId: selectedUser.id,
      message: null
    })

    if (onCallEnd) {
      onCallEnd()
    }
  }
</script>

<div class="call-window">
  <div class="call-header">
    <h2>Call with {selectedUser.username}</h2>
  </div>

  <div class="call-content">
    <div class="user-avatar">
      <div class="avatar-circle">
        {selectedUser.username.charAt(0).toUpperCase()}
      </div>
    </div>

    <div class="call-info">
      {#if callStatus === 'connecting'}
        <p class="status connecting">Connecting...</p>
      {:else if callStatus === 'connected'}
        <p class="status connected">Connected</p>
        <p class="duration">{formatDuration(callDuration)}</p>
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

  <!-- Hidden audio element for remote stream -->
  <audio bind:this={remoteAudio} autoplay></audio>
</div>

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
