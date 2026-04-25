<script lang="ts">
  import type { Channel } from '$src/interfaces/Channel'
  import { channelCallService } from '$src/services/call/ChannelCallService'
  import { callState } from '$src/states/CallState.svelte.js'
  import Icon from '$src/components/common/icons/Icon.svelte'
  import { navigationState } from '$src/states/NavigationState.svelte'
  import { sessionState } from '$src/states/SessionState.svelte'

  let {
    channel,
    isOpen = $bindable(false)
  }: {
    channel: Channel | null
    isOpen: boolean
  } = $props()

  let isInChannelCall = $derived(
    callState.isGroupCall && callState.groupCallState?.channelId === channel.id
  )
  let voiceParticipants = $derived(channel?.voiceParticipants ?? [])

  function onJoinChannel(): void {
    if (isInChannelCall) {
      channelCallService.endChannelCall()
    } else {
      channelCallService.joinVoiceChannel(channel.id)
    }
  }

  function onLeaveChannel(): void {
    channelCallService.endChannelCall()
  }
</script>

<aside class="sidebar" class:closed={!isOpen || !channel}>
  <div class="sidebar-header">
    <span class="sidebar-title">Channel info</span>
    <button class="close-btn" onclick={() => (isOpen = false)} aria-label="Close sidebar">
      <Icon name="x" size={12} strokeWidth={1.8} />
    </button>
  </div>

  <div class="sidebar-scroll">
    <section class="sidebar-section voice-section">
      <div class="section-header voice-header">
        <span class="live-dot"></span>
        <span class="section-title">Voice</span>
        {#if voiceParticipants.length > 0}
          <span class="voice-count">{voiceParticipants.length}</span>
        {/if}
      </div>

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

      <div class="voice-actions">
        {#if isInChannelCall}
          <button class="leave-voice-btn" onclick={onLeaveChannel}>Leave channel →</button>
        {:else}
          {#if voiceParticipants.length === 0}
            <p class="voice-empty-text">No one in voice</p>
          {/if}
          <button class="join-voice-btn" onclick={onJoinChannel}>Join channel →</button>
        {/if}
      </div>
    </section>

    <section class="sidebar-section">
      <div class="section-header">
        <Icon name="users" size={12} strokeWidth={2.5} />
        <span class="section-title">Members</span>
      </div>
      <div class="members-empty">
        {#each navigationState.selectedSpace?.members ?? [] as member (member.user.id)}
          <div class="member-entry">
            <span class="presence-dot" class:online={member.user.isOnline}></span>
            <p class="member-entry-text" class:offline={!member.user.isOnline}>
              {member.user.displayName}
            </p>
          </div>
        {/each}
      </div>
    </section>
  </div>
</aside>

<style>
  .sidebar {
    width: 220px;
    flex-shrink: 0;
    background: #f7f7fa;
    border-radius: 15px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition:
      width 0.25s ease,
      opacity 0.25s ease;
    opacity: 1;
  }

  .sidebar.closed {
    width: 0;
    opacity: 0;
  }

  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 14px 12px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.07);
    flex-shrink: 0;
    background: white;
  }

  .sidebar-title {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: #888;
  }

  .close-btn {
    width: 24px;
    height: 24px;
    border-radius: 6px;
    border: none;
    background: none;
    cursor: pointer;
    color: #bbb;
    display: flex;
    align-items: center;
    justify-content: center;
    transition:
      background 0.12s,
      color 0.12s;
    padding: 0;
  }

  .close-btn:hover {
    background: rgba(0, 0, 0, 0.07);
    color: #666;
  }

  .sidebar-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .sidebar-scroll::-webkit-scrollbar {
    width: 3px;
  }

  .sidebar-scroll::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 3px;
  }

  .sidebar-section {
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

  .voice-section {
    background: rgba(61, 214, 140, 0.05);
    border: 1px solid rgba(61, 214, 140, 0.12);
    border-radius: 10px;
    padding: 10px 12px;
  }

  .voice-header {
    margin-bottom: 4px;
  }

  .live-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #3dd68c;
    flex-shrink: 0;
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

  .member-entry-text.offline {
    color: #bbb;
  }

  .voice-empty-text {
    font-size: 12px;
    color: #aaa;
  }
  .join-voice-btn {
    width: 100%;
    padding: 5px 0;
    background: rgba(61, 214, 140, 0.1);
    border: 1px solid rgba(61, 214, 140, 0.25);
    border-radius: 7px;
    font-size: 12px;
    font-weight: 600;
    color: #3dd68c;
    cursor: pointer;
    font-family: inherit;
    transition: background 0.15s;
  }

  .leave-voice-btn {
    width: 100%;
    padding: 5px 0;
    background: rgba(214, 61, 61, 0.1);
    border: 1px solid rgb(228, 99, 99);
    border-radius: 7px;
    font-size: 12px;
    font-weight: 600;
    color: #ff6203;
    cursor: pointer;
    font-family: inherit;
    transition: background 0.15s;
  }

  .join-voice-btn:hover {
    background: rgba(61, 214, 140, 0.18);
  }

  .members-empty {
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

  .voice-count {
    margin-left: auto;
    font-size: 11px;
    font-weight: 600;
    color: #3dd68c;
    background: rgba(61, 214, 140, 0.12);
    border-radius: 999px;
    padding: 1px 7px;
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

  .voice-actions {
    padding-top: 4px;
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
