<script lang="ts">
  import { srcObject } from '$src/actions/srcObject'
  import { onDestroy, onMount } from 'svelte'
  import { fade, scale } from 'svelte/transition'
  import { cubicInOut } from 'svelte/easing'
  import { callState } from '$src/states/CallState.svelte'
  import { marginState } from '$src/states/MarginState.svelte'
  import type { Meeting } from '$src/interfaces/Meetings'
  import { meetingCallService } from '$src/services/call/MeetingCallService'
  import { meetingService } from '$src/services/MeetingService'
  import { meetingGuestService } from '$src/services/MeetingGuestService'
  import CallLayout from '$src/components/content/call/CallLayout.svelte'
  import MeetingAdmitPanel from '$src/components/content/call/MeetingAdmitPanel.svelte'
  import CallPipWidget from '$src/components/content/call/CallPipWidget.svelte'
  import type { CallParticipant } from '$src/interfaces/Calls'
  import { sessionState } from '$src/states/SessionState.svelte'

  const { onLeave }: { onLeave?: () => void } = $props()

  let linkCopied = $state(false)
  let inviteOpen = $state(false)

  const localStream = $derived(callState.groupCallState?.session?.localStream ?? null)

  const localVideoStream = $derived.by(() => {
    const videoProducer = callState.groupCallState?.session?.videoProducer
    if (!videoProducer?.track) return null
    return new MediaStream([videoProducer.track])
  })

  const localParticipant = $derived<CallParticipant>({
    id: Number(callState.groupCallState?.localPeerId ?? -1),
    displayName: 'You',
    profilePictureUrl: sessionState.currentUser?.profilePictureUrl ?? null,
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

  const meetingCode = $derived(callState.groupCallState?.meetingCode ?? null)
  const meetingTitle = $derived(callState.groupCallState?.title ?? 'Meeting')

  async function copyLink(): Promise<void> {
    if (!meetingCode) return
    await navigator.clipboard.writeText(meetingService.shareLink(meetingCode))
    linkCopied = true
    setTimeout(() => (linkCopied = false), 2000)
  }

  function leave(): void {
    meetingCallService.endMeetingCall()
    onLeave?.()
  }

  let invitedUserIds = $state<number[]>([])
  let meeting = $state<Meeting | null>(null)
  const isGuest = meetingGuestService.hasSession()

  onMount(async () => {
    if (!meetingCode || isGuest) return
    meeting = await meetingService.getMeeting(meetingCode)
  })

  const invitableMembers = $derived.by(() => {
    const meetingMargin = marginState.margins.find((m) => m.marginId === meeting?.marginId)
    if (!meetingMargin) return []
    const inCall = new Set(
      (callState.groupCallState?.participants ?? []).map((p) => Number(p.peerId))
    )
    return meetingMargin.members
      .filter((m) => m.userId !== sessionState.currentUser?.id)
      .filter((m) => !inCall.has(m.userId))
  })

  function ringMember(userId: number): void {
    if (!meetingCode) return
    meetingService.invite(userId, meetingCode)
    invitedUserIds = [...invitedUserIds, userId]
  }

  onDestroy(() => meetingCallService.endMeetingCall())
</script>

{#snippet invitePanel()}
  <div class="invite-panel">
    <p class="invite-panel-title">Invite to meeting</p>
    <p class="invite-panel-hint">Anyone with this link can ask to join.</p>
    <button class="copy-link-btn" onclick={copyLink}>
      {linkCopied ? 'Link copied' : 'Copy meeting link'}
    </button>

    {#if invitableMembers.length > 0}
      <div class="invite-panel-list">
        {#each invitableMembers as member (member.userId)}
          <div class="invite-panel-row">
            <p class="invite-panel-name">{member.displayName}</p>
            {#if invitedUserIds.includes(member.userId)}
              <span class="invite-sent">Invited</span>
            {:else}
              <button class="invite-btn" onclick={() => ringMember(member.userId)}>Ring</button>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
{/snippet}

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
      {#if meetingCode && !isGuest}
        <MeetingAdmitPanel code={meetingCode} />
      {/if}
      <CallLayout
        {localParticipant}
        {remoteParticipants}
        {remoteScreenStream}
        isAudioEnabled={callState.groupCallState?.isAudioEnabled ?? true}
        isVideoEnabled={callState.groupCallState?.isVideoEnabled ?? false}
        isScreenSharing={callState.groupCallState?.isScreenSharing ?? false}
        {isRemoteScreenSharing}
        status={callState.status}
        duration={callState.duration}
        showDuration={false}
        callTitle={meetingTitle}
        forceGrid={remoteParticipants.length > 1}
        onToggleInvite={() => (inviteOpen = !inviteOpen)}
        isInviteOpen={inviteOpen}
        {invitePanel}
        onMinimize={() => {
          inviteOpen = false
          callState.toggleMinimized()
        }}
        onToggleAudio={() => meetingCallService.toggleAudio()}
        onToggleVideo={() => meetingCallService.toggleVideo()}
        onToggleScreenShare={() => meetingCallService.toggleScreenShare()}
        onEndCall={leave}
      />
    </div>
  {/if}
{/if}

<style>
  .sfu-call-wrapper {
    width: 100%;
    height: 100%;
    display: flex;
  }

  .invite-panel {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    min-width: 220px;
  }

  .invite-panel-title {
    margin: 0;
    font-weight: 600;
    font-size: 14px;
  }

  .invite-panel-hint {
    margin: 0;
    font-size: 12px;
    opacity: 0.7;
  }

  .copy-link-btn {
    padding: 8px 12px;
    border: none;
    border-radius: 6px;
    background-color: #f47e3a;
    color: white;
    cursor: pointer;
    font-size: 13px;
  }

  .copy-link-btn:hover {
    filter: brightness(1.05);
  }
</style>
