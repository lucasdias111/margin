<script lang="ts">
  import type { Channel } from '$src/interfaces/Channel'
  import { notificationState } from '$src/states/NotificationState.svelte.js'
  import UnreadNotificationBadge from '$src/components/common/chat/UnreadNotificationBadge.svelte'
  import { channelService } from '$src/services/ChannelService'

  interface Props {
    channel: Channel
    active: boolean
  }

  let { channel, active }: Props = $props()

  let hasUnread = $derived(notificationState.isChannelUnread(channel.conversationId))

  function selectChannel(): void {
    channelService.select(channel)
  }
</script>

<li class="channel-item">
  <button class="channel-button" class:active onclick={selectChannel}>
    <span class="channel-name">{channel.name}</span>
    {#if channel.voiceParticipants && channel.voiceParticipants.length > 0}
      <span class="voice-indicator">
        <span class="voice-indicator-dot"></span>
        {channel.voiceParticipants.length}
      </span>
    {/if}
    <UnreadNotificationBadge shouldShow={hasUnread} count={1} variant="inline" />
  </button>
</li>

<style>
  .channel-item {
    list-style: none;
  }

  .channel-button {
    position: relative;
    width: 100%;
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 5px 8px;
    background: none;
    border: none;
    border-radius: 7px;
    font-size: 13px;
    color: #888;
    cursor: pointer;
    text-align: left;
    transition:
      background 0.12s,
      color 0.12s;
  }

  .channel-button:hover {
    background: rgba(0, 0, 0, 0.05);
    color: #444;
  }

  .channel-button.active {
    background: rgba(228, 113, 42, 0.1);
    color: #d4621a;
    font-weight: 600;
  }

  .channel-name {
    flex: 1;
  }

  .voice-indicator {
    display: flex;
    align-items: center;
    gap: 3px;
    font-size: 11px;
    font-weight: 600;
    color: #3dd68c;
  }

  .voice-indicator-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #3dd68c;
    animation: pulse 2s infinite;
  }
</style>
