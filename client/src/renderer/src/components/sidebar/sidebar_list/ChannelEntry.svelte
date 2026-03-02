<script lang="ts">
  import type { Channel } from '$src/interfaces/Channel'
  import { chatState } from '$src/states/ChatState.svelte'
  import { notificationState } from '$src/states/NotificationState.svelte'
  import UnreadNotificationBadge from '$src/components/chat/UnreadNotificationBadge.svelte'

  interface Props {
    channel: Channel
    active: boolean
  }

  let { channel, active }: Props = $props()

  let hasUnread = $derived(
    notificationState.getTotalUnreadMessagesForChannel(channel.conversationId).length > 0
  )

  function selectChannel(): void {
    chatState.selectChannel(channel)
  }
</script>

<li class="channel-item">
  <button class="channel-button" class:active onclick={selectChannel}>
    <span class="channel-name">{channel.name}</span>
    <UnreadNotificationBadge
      shouldShow={hasUnread}
      count={notificationState.getTotalUnreadMessagesForChannel(channel.conversationId).length}
      variant="inline"
    />
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
    transition: background 0.12s,
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
</style>
