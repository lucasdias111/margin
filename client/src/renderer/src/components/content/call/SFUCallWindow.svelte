<script lang="ts">
  import { srcObject } from '$src/actions/srcObject'
  import { onDestroy } from 'svelte'
  import { fade, scale } from 'svelte/transition'
  import { cubicInOut } from 'svelte/easing'
  import { callState } from '$src/states/CallState.svelte'
  import { channelCallService } from '$src/services/call/ChannelCallService'
  import { userState } from '$src/states/UserState.svelte'
  import { chatState } from '$src/states/ChatState.svelte'
  import CallLayout from '$src/components/content/call/CallLayout.svelte'
  import CallPipWidget from '$src/components/content/call/CallPipWidget.svelte'
  import type { CallParticipant } from '$src/interfaces/Calls'

  const localStream = $derived(callState.groupCallState?.session?.localStream ?? null)

  const localVideoStream = $derived.by(() => {
    const videoProducer = callState.groupCallState?.session?.videoProducer
    if (!videoProducer?.track) return null
    return new MediaStream([videoProducer.track])
  })

  const localParticipant = $derived<CallParticipant>({
    id: userState.currentUser?.id ?? -1,
    displayName: 'You',
    profilePictureUrl: userState.currentUser?.profilePictureUrl ?? null,
    stream: localVideoStream ?? localStream,
    isVideoEnabled: callState.groupCallState?.isVideoEnabled ?? false,
    isScreenSharing: callState.groupCallState?.isScreenSharing ?? false,
    isLocal: true
  })

  const remoteParticipants = $derived<CallParticipant[]>(
    (callState.groupCallState?.participants ?? []).map((p) => ({
      id: Number(p.peerId),
      displayName: p.displayName,
      profilePictureUrl: p.profilePictureUrl,
      stream: p.videoStream ?? p.audioStream,
      isVideoEnabled: p.isVideoEnabled,
      isScreenSharing: p.isScreenSharing,
      isLocal: false
    }))
  )

  const remoteScreenStream = $derived(
    callState.groupCallState?.participants.find((p) => p.isScreenSharing)?.screenStream ?? null
  )

  const isRemoteScreenSharing = $derived(remoteParticipants.some((p) => p.isScreenSharing))

  const pipStream = $derived(
    remoteParticipants.find((p) => p.isVideoEnabled)?.stream ??
      remoteParticipants[0]?.stream ??
      null
  )

  const channelName = $derived(chatState.selectedChannel?.name ?? 'Voice channel')

  onDestroy(() => channelCallService.endChannelCall())
</script>

{#if callState.groupCallState}
  {#each callState.groupCallState.participants as participant (participant.peerId)}
    {#if participant.audioStream}
      <audio use:srcObject={participant.audioStream} autoplay style="display:none"></audio>
    {/if}
  {/each}
  {#if callState.isMinimized}
    <div
      in:scale={{ duration: 250, start: 0.85, easing: cubicInOut, opacity: 0 }}
      out:scale={{ duration: 200, start: 0.85, easing: cubicInOut, opacity: 0 }}
    >
      <CallPipWidget
        remoteVideoStream={pipStream}
        screenShareStream={remoteScreenStream}
        onRestore={() => callState.toggleMinimized()}
        showDuration={false}
      />
    </div>
  {:else}
    <div
      class="sfu-call-wrapper"
      in:fade={{ duration: 200, easing: cubicInOut }}
      out:scale={{ duration: 250, start: 0.95, easing: cubicInOut, opacity: 0 }}
    >
      <CallLayout
        {localParticipant}
        {remoteParticipants}
        {remoteScreenStream}
        isAudioEnabled={true}
        isVideoEnabled={callState.groupCallState?.isVideoEnabled ?? false}
        isScreenSharing={callState.groupCallState?.isScreenSharing ?? false}
        {isRemoteScreenSharing}
        status={callState.status}
        duration={callState.duration}
        showDuration={false}
        callTitle={channelName}
        forceGrid={remoteParticipants.length > 1}
        onMinimize={() => callState.toggleMinimized()}
        onToggleAudio={() => {}}
        onToggleVideo={() => channelCallService.toggleVideo()}
        onToggleScreenShare={() => channelCallService.toggleScreenShare()}
        onEndCall={() => channelCallService.endChannelCall()}
      />
    </div>
  {/if}
{/if}

<style>
  .sfu-call-wrapper {
    width: 100%;
    height: 100%;
  }
</style>
