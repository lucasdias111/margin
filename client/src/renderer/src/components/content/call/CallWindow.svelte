<script lang="ts">
  import { srcObject } from '$src/actions/srcObject'
  import { onMount, onDestroy } from 'svelte'
  import { fade, scale } from 'svelte/transition'
  import { cubicInOut } from 'svelte/easing'
  import { callState } from '$src/states/CallState.svelte'
  import { callService } from '$src/services/call/CallService'
  import {
    onCallCandidate,
    onCallCreated,
    onCallMediaState,
    onCallResponse
  } from '$src/composables/useCallWebSocket.svelte'
  import CallPipWidget from '$src/components/content/call/CallPipWidget.svelte'
  import CallLayout from '$src/components/content/call/CallLayout.svelte'

  const { user, isIncoming, offer } = callState.p2pCallState!

  const remoteStream = $derived(callState.p2pCallState?.remoteStream ?? null)
  const localStream = $derived(callState.p2pCallState?.localStream ?? null)
  const remoteScreenStream = $derived(callState.p2pCallState?.remoteScreenStream ?? null)
  const remoteVideoStream = $derived.by(() => {
    if (!callState.p2pCallState?.isRemoteVideoEnabled) return null
    const stream = callState.p2pCallState?.remoteStream
    if (!stream) return null
    const videoTrack = stream.getVideoTracks()[0]
    if (!videoTrack) return null
    return new MediaStream([videoTrack])
  })

  onCallCreated((data) => callState.setCallId(data.payload!.callId))
  onCallResponse(async (data) => await callService.handleCallResponse(data))
  onCallCandidate(async (data) => await callService.handleCallCandidate(data))
  onCallMediaState((data) =>
    callService.handleMediaState(data.payload!.video, data.payload!.screenShare)
  )

  onMount(async () => {
    if (isIncoming) {
      await callService.answerCall(user.id, offer!)
    } else {
      await callService.initiateCall(user.id)
    }
  })

  onDestroy(() => callService.endCall(true))

  const localParticipant = $derived({
    id: -1,
    displayName: 'You',
    profilePictureUrl: null,
    stream: localStream,
    isVideoEnabled: callState.p2pCallState?.isVideoEnabled ?? false,
    isScreenSharing: callState.p2pCallState?.isScreenSharing ?? false,
    isLocal: true
  })

  const remoteParticipants = $derived(
    callState.p2pCallState
      ? [
          {
            id: user.id,
            displayName: user.displayName,
            profilePictureUrl: user.profilePictureUrl ?? null,
            stream: remoteVideoStream ?? remoteStream,
            isVideoEnabled: callState.p2pCallState.isRemoteVideoEnabled,
            isScreenSharing: callState.p2pCallState.isRemoteScreenSharing,
            isLocal: false
          }
        ]
      : []
  )
</script>

{#if callState.p2pCallState}
  <audio use:srcObject={remoteStream} autoplay style="display:none"></audio>
  {#if callState.isMinimized}
    <div
      in:scale={{ duration: 250, start: 0.85, easing: cubicInOut, opacity: 0 }}
      out:scale={{ duration: 200, start: 0.85, easing: cubicInOut, opacity: 0 }}
    >
      <CallPipWidget
        remoteVideoStream={remoteStream}
        screenShareStream={remoteScreenStream}
        onRestore={() => callState.toggleMinimized()}
      />
    </div>
  {:else}
    <div
      class="call-layout-wrapper"
      in:fade={{ duration: 200, easing: cubicInOut }}
      out:scale={{ duration: 250, start: 0.95, easing: cubicInOut, opacity: 0 }}
    >
      <CallLayout
        {localParticipant}
        {remoteParticipants}
        {remoteScreenStream}
        isAudioEnabled={callState.p2pCallState.isAudioEnabled}
        isVideoEnabled={callState.p2pCallState.isVideoEnabled}
        isScreenSharing={callState.p2pCallState.isScreenSharing}
        isRemoteScreenSharing={callState.p2pCallState.isRemoteScreenSharing}
        status={callState.status}
        duration={callState.duration}
        onMinimize={() => callState.toggleMinimized()}
        onToggleAudio={() => callService.toggleAudio()}
        onToggleVideo={() => callService.toggleVideo()}
        onToggleScreenShare={() =>
          callState.p2pCallState?.isScreenSharing
            ? callService.stopScreenShare()
            : callService.startScreenShare()}
        onEndCall={() => callService.endCall(false)}
      />
    </div>
  {/if}
{/if}

<style>
  .call-layout-wrapper {
    width: 100%;
    height: 100%;
  }
</style>
