<script lang="ts">
  import { ChannelType, type Channel } from '$src/interfaces/Channel'
  import { notificationService } from '$src/services/NotificationService'
  import UnreadNotificationBadge from '$src/components/common/chat/UnreadNotificationBadge.svelte'
  import Icon from '$src/components/common/icons/Icon.svelte'
  import type { IconName } from '$src/components/common/icons/icons'
  import { channelService } from '$src/services/ChannelService'
  import { pressable } from '$src/animations'

  interface Props {
    channel: Channel
    active: boolean
  }

  let { channel, active }: Props = $props()

  let hasUnread = $derived(notificationService.isUnread(channel.conversationId))
  let typeIcon: IconName = $derived(
    channel.channelType === ChannelType.THREAD
      ? 'layout'
      : channel.channelType === ChannelType.ANNOUNCEMENT
        ? 'announcements'
        : 'messages'
  )

  function selectChannel(): void {
    channelService.select(channel)
  }
</script>

<button class="channel-button" class:active onclick={selectChannel} use:pressable={{ scale: 0.98 }}>
  <span class="channel-type-icon">
    <Icon name={typeIcon} size={14} />
  </span>
  <span class="channel-name">{channel.name}</span>
  <UnreadNotificationBadge shouldShow={hasUnread} count={1} variant="inline" />
  {#if channel.voiceParticipants && channel.voiceParticipants.length > 0}
    <span class="voice-count">{channel.voiceParticipants.length}</span>
    <span class="voice-indicator-dot"></span>
  {/if}
</button>

<style>
  .channel-button {
    position: relative;
    width: 100%;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    background: none;
    border: none;
    border-radius: 8px;
    font-size: 13px;
    color: #77776f;
    cursor: pointer;
    text-align: left;
    transition:
      background var(--motion-fast) var(--ease-standard),
      color var(--motion-fast) var(--ease-standard);
  }

  .channel-button:hover {
    background: rgba(0, 0, 0, 0.045);
    color: #2a2a2a;
  }

  .channel-button.active {
    background: rgba(228, 113, 42, 0.1);
    color: #ff843c;
    font-weight: 600;
  }

  .channel-name {
    flex: 1;
  }

  .channel-type-icon {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    color: #b4b4ae;
    transition: color var(--motion-fast) var(--ease-standard);
  }

  .channel-button:hover .channel-type-icon,
  .channel-button.active .channel-type-icon {
    color: inherit;
  }

  .voice-indicator-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #3dd68c;
    flex-shrink: 0;
    animation: pulse 2s infinite;
  }

  .voice-count {
    font-size: 11px;
    font-weight: 600;
    color: #3dd68c;
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
