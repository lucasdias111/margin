<script lang="ts">
  import type { Channel } from '$src/interfaces/Channel'
  import type { User } from '$src/interfaces/User'
  import { channelCallService } from '$src/services/call/ChannelCallService'
  import { callState } from '$src/states/CallState.svelte.js'
  import Icon from '$src/components/common/icons/Icon.svelte'
  import { navigationState } from '$src/states/NavigationState.svelte.js'
  import { sessionState } from '$src/states/SessionState.svelte.js'
  import { usersState } from '$src/states/UsersState.svelte.js'

  let { channel }: { channel: Channel | null } = $props()

  let isInChannelCall = $derived(
    callState.isGroupCall && callState.groupCallState?.channelId === channel?.id
  )
  let voiceParticipants = $derived<User[]>(
    (channel?.voiceParticipants ?? [])
      .map((p) => usersState.byId.get(p.id))
      .filter((u): u is User => u !== undefined)
  )
  let spaceMembers = $derived<User[]>(
    (navigationState.selectedSpace?.members ?? [])
      .map((member) => usersState.byId.get(member.user.id))
      .filter((u) => u !== undefined)
  )

  function onJoinChannel(): void {
    if (!channel) return
    channelCallService.joinVoiceChannel(channel.id)
  }

  function onLeaveChannel(): void {
    channelCallService.endChannelCall()
  }
</script>

<section class="voice-section">
  <div class="voice-status">
    <span class="live-dot" class:active={voiceParticipants.length > 0}></span>
    <span class="voice-status-text">
      {#if voiceParticipants.length === 0}
        No one in voice
      {:else if voiceParticipants.length === 1}
        1 person in voice
      {:else}
        {voiceParticipants.length} people in voice
      {/if}
    </span>
  </div>

  {#if voiceParticipants.length > 0}
    <div class="voice-participants">
      {#each voiceParticipants as participant (participant.id)}
        <div
          class="voice-participant"
          class:is-me={participant.id === sessionState.currentUser?.id}
        >
          <span class="voice-dot"></span>
          <p class="voice-participant-name">{participant.displayName}</p>
        </div>
      {/each}
    </div>
  {/if}

  {#if isInChannelCall}
    <button class="leave-voice-btn" onclick={onLeaveChannel}>Leave</button>
  {:else}
    <button class="join-voice-btn" onclick={onJoinChannel}>Join voice</button>
  {/if}
</section>

<section class="members-section">
  <div class="section-header">
    <Icon name="users" size={12} strokeWidth={2.5} />
    <span class="section-title">Members</span>
  </div>
  <div class="members-list">
    {#each spaceMembers ?? [] as member (member.id)}
      <div class="member-entry">
        <span class="presence-dot" class:online={member.isOnline}></span>
        <p class="member-entry-text" class:offline={!member.isOnline}>
          {member.displayName}
        </p>
      </div>
    {/each}
  </div>
</section>

<style>
  .voice-section {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .voice-status {
    display: flex;
    align-items: center;
    gap: 7px;
  }

  .voice-status-text {
    font-size: 12px;
    color: #999;
  }

  .live-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #ccc;
    flex-shrink: 0;
    transition: background 0.2s;
  }

  .live-dot.active {
    background: #3dd68c;
    animation: pulse 2s infinite;
  }

  .voice-participants {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 2px 0;
  }

  .voice-participant {
    display: flex;
    align-items: center;
    gap: 7px;
    padding-left: 4px;
  }

  .voice-participant.is-me .voice-participant-name {
    color: #3dd68c;
  }

  .voice-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #3dd68c;
    flex-shrink: 0;
    animation: pulse 2s infinite;
  }

  .voice-participant-name {
    margin: 0;
    font-size: 13px;
    color: #444;
  }

  .join-voice-btn {
    width: 100%;
    padding: 7px 0;
    background: #3dd68c;
    border: none;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    color: white;
    cursor: pointer;
    font-family: inherit;
    transition: opacity 0.15s;
  }

  .join-voice-btn:hover {
    opacity: 0.88;
  }

  .leave-voice-btn {
    width: 100%;
    padding: 7px 0;
    background: rgba(0, 0, 0, 0.05);
    border: none;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 500;
    color: #999;
    cursor: pointer;
    font-family: inherit;
    transition: background 0.15s;
  }

  .leave-voice-btn:hover {
    background: rgba(220, 60, 60, 0.08);
    color: #d94f4f;
  }

  .members-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #aaa;
  }

  .section-title {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: #aaa;
  }

  .members-list {
    padding: 4px 0;
  }

  .member-entry {
    display: flex;
    align-items: center;
    gap: 7px;
    color: #aaa;
    padding-left: 10px;
  }

  .member-entry-text {
    margin: 0;
    padding: 2px 3px;
    font-size: 14px;
  }

  .member-entry-text.offline {
    color: #bbb;
  }

  .presence-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #ccc;
    flex-shrink: 0;
  }

  .presence-dot.online {
    background: #3dd68c;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.4;
    }
  }
</style>
