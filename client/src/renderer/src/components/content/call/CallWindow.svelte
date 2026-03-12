<script lang="ts">
  import { onMount, tick } from 'svelte'
  import { WebSocketMessageType } from '$src/interfaces/WebSocketMessageType'
  import { callState } from '$src/states/CallState.svelte.js'
  import type {
    CallCandidatePayload,
    CallResponsePayload,
    WebSocketMessage
  } from '$src/interfaces/WebSocketMessages'
  import { callService } from '$src/services/CallService'
  import { useWebsocketSvelte } from '$src/composables/useWebsocket.svelte.js'
  import CallPipWidget from '$src/components/content/call/CallPipWidget.svelte'
  import CallWindowContent from '$src/components/content/call/CallWindowContent.svelte'

  let remoteAudio = $state<HTMLAudioElement | null>(null)
  let remoteVideo = $state<HTMLVideoElement | null>(null)
  let localVideo = $state<HTMLVideoElement | null>(null)
  let screenShareVideo = $state<HTMLVideoElement | null>(null)
  let remoteVideoStream = $state<MediaStream | null>(null)
  let screenShareStream = $state<MediaStream | null>(null)

  onMount(() => {
    if (!callState.isP2PCall || !callState.p2pCallState) return
    const { user, isIncoming, offer } = callState.p2pCallState

    callService.onRemoteStream((stream) => {
      if (remoteAudio) remoteAudio.srcObject = stream
      if (stream.getVideoTracks().length > 0) remoteVideoStream = stream
    })

    callService.onLocalStream((stream) => {
      if (localVideo && stream.getVideoTracks().length > 0) localVideo.srcObject = stream
    })

    callService.onRemoteScreenShare(async (stream) => {
      if (stream) {
        screenShareStream = stream
        callState.setRemoteScreenSharing(true)
        await tick()
        if (screenShareVideo) screenShareVideo.srcObject = stream
      } else {
        screenShareStream = null
        if (screenShareVideo) screenShareVideo.srcObject = null
        callState.setRemoteScreenSharing(false)
      }
    })

    if (isIncoming && offer) {
      callService.answerCall(user.id, offer)
    } else {
      callService.initiateCall(user.id)
      callService.noAnswer()
    }
  })

  $effect(() => {
    if (screenShareVideo && screenShareStream) screenShareVideo.srcObject = screenShareStream
  })

  $effect(() => {
    if (callState.p2pCallState?.isRemoteVideoEnabled && remoteVideo && remoteVideoStream) {
      remoteVideo.srcObject = remoteVideoStream
    }
  })

  $effect(() => {
    const stream = callState.p2pCallState?.localStream
    if (callState.p2pCallState?.isVideoEnabled && localVideo && stream) {
      localVideo.srcObject = stream
    }
  })

  useWebsocketSvelte({
    [WebSocketMessageType.CALL_RESPONSE]: async (data: WebSocketMessage<CallResponsePayload>) =>
      await callService.handleCallResponse(data),
    [WebSocketMessageType.CALL_CANDIDATE]: async (data: WebSocketMessage<CallCandidatePayload>) =>
      await callService.handleIceCandidate(data),
    [WebSocketMessageType.CALL_CREATED]: (data: WebSocketMessage<{ callId: number }>) =>
      callState.setCallId(data.payload!.callId)
  })

  function handleMinimize(): void {
    callState.toggleMinimized()
  }

  function handleRestore(): void {
    callState.toggleMinimized()
  }
</script>

{#if callState.isP2PCall && callState.p2pCallState}
  <audio bind:this={remoteAudio} autoplay style="display:none"></audio>

  <div style="display:none">
    <video bind:this={remoteVideo} autoplay playsinline></video>
    <video bind:this={localVideo} autoplay playsinline muted></video>
    <video bind:this={screenShareVideo} autoplay playsinline></video>
  </div>

  {#if callState.isMinimized}
    <CallPipWidget {remoteVideoStream} {screenShareStream} onRestore={handleRestore} />
  {:else}
    <CallWindowContent
      bind:remoteVideo
      bind:localVideo
      bind:screenShareVideo
      onMinimize={handleMinimize}
    />
  {/if}
{/if}
