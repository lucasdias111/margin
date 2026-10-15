<script lang="ts">
  import { srcObject } from '$src/actions/srcObject'
  import { onDestroy } from 'svelte'
  import { fade, scale } from 'svelte/transition'
  import { cubicInOut } from 'svelte/easing'
  import { callState } from '$src/states/CallState.svelte'
  import { channelCallService } from '$src/services/call/ChannelCallService'
  import CallLayout from '$src/components/content/call/CallLayout.svelte'
  import CallPipWidget from '$src/components/content/call/CallPipWidget.svelte'
  import type { CallParticipant } from '$src/interfaces/Calls'
  import type { User } from '$src/interfaces/User'
  import { navigationState } from '$src/states/NavigationState.svelte'
  import { sessionState } from '$src/states/SessionState.svelte'
  import { spaceState } from '$src/states/SpaceState.svelte'
  import { usersState } from '$src/states/UsersState.svelte'
  import UserAvatar from '$src/components/common/user/UserAvatar.svelte'

  const localStream = $derived(callState.groupCallState?.session?.localStream ?? null)

  const localVideoStream = $derived.by(() => {
    const videoProducer = callState.groupCallState?.session?.videoProducer
    if (!videoProducer?.track) return null
    return new MediaStream([videoProducer.track])
  })

  const localParticipant = $derived<CallParticipant>({
    id: sessionState.currentUser?.id ?? -1,
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

  const callChannelId = $derived(callState.groupCallState?.channelId ?? null)

  const callSpace = $derived(
    spaceState.spaces.find((s) => s.channels.some((c) => c.id === callChannelId)) ?? null
  )

  const channelName = $derived(
    callSpace?.channels.find((c) => c.id === callChannelId)?.name ??
      navigationState.selectedChannel?.name ??
      'Voice channel'
  )

  const INVITE_COOLDOWN_MS = 20000
  let inviteOpen = $state(false)
  let invitedMemberIds = $state<number[]>([])

  const invitableMembers = $derived<User[]>(
    (callSpace?.members ?? [])
      .map((m) => usersState.byId.get(m.user.id))
      .filter((u): u is User => u !== undefined)
      .filter(
        (u) =>
          u.id !== sessionState.currentUser?.id &&
          u.isOnline &&
          !remoteParticipants.some((p) => p.id === u.id)
      )
  )

  function onInviteMember(member: User): void {
    if (callChannelId === null || invitedMemberIds.includes(member.id)) return
    channelCallService.inviteToChannelCall(member.id, callChannelId)
    invitedMemberIds = [...invitedMemberIds, member.id]
    setTimeout(() => {
      invitedMemberIds = invitedMemberIds.filter((id) => id !== member.id)
    }, INVITE_COOLDOWN_MS)
  }

  onDestroy(() => channelCallService.endChannelCall())
</script>

{#snippet invitePanel()}
  <div class="invite-panel">
    <p class="invite-panel-title">Invite to call</p>
    {#if invitableMembers.length === 0}
      <p class="invite-panel-empty">No one available to invite</p>
    {:else}
      <div class="invite-panel-list">
        {#each invitableMembers as member (member.id)}
          <div class="invite-panel-row">
            <UserAvatar profilePictureUrl={member.profilePictureUrl} width={24} height={24} />
            <p class="invite-panel-name">{member.displayName}</p>
            {#if invitedMemberIds.includes(member.id)}
              <span class="invite-sent">Invited</span>
            {:else}
              <button class="invite-to-call-btn" onclick={() => onInviteMember(member)}>
                Invite
              </button>
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
        callTitle={channelName}
        forceGrid={remoteParticipants.length > 1}
        onToggleInvite={() => (inviteOpen = !inviteOpen)}
        isInviteOpen={inviteOpen}
        {invitePanel}
        onMinimize={() => {
          inviteOpen = false
          callState.toggleMinimized()
        }}
        onToggleAudio={() => channelCallService.toggleAudio()}
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

  .invite-panel {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    margin-bottom: 12px;
    width: 260px;
    max-height: 320px;
    overflow-y: auto;
    padding: 14px;
    background: rgba(30, 30, 30, 0.95);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 14px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    text-align: left;
  }

  .invite-panel-title {
    margin: 0 0 10px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: rgba(255, 255, 255, 0.5);
  }

  .invite-panel-empty {
    margin: 0;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.5);
  }

  .invite-panel-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .invite-panel-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .invite-panel-name {
    margin: 0;
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.9);
  }

  .invite-to-call-btn {
    flex-shrink: 0;
    padding: 3px 10px;
    background: rgba(61, 214, 140, 0.15);
    border: none;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 600;
    color: #3dd68c;
    cursor: pointer;
    font-family: inherit;
    transition: background 0.15s;
  }

  .invite-to-call-btn:hover {
    background: rgba(61, 214, 140, 0.28);
  }

  .invite-sent {
    flex-shrink: 0;
    padding: 3px 10px;
    font-size: 11px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.4);
  }
</style>
