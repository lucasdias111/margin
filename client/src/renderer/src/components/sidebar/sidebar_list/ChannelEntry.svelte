<script lang="ts">
  import type { Channel } from '$src/interfaces/Channel'
  import { chatState } from '$src/states/ChatState.svelte'
  import { notificationState } from '$src/states/NotificationState.svelte'
  import UnreadNotificationBadge from '$src/components/chat/UnreadNotificationBadge.svelte'

  interface Props {
    channel: Channel
  }

  let { channel }: Props = $props()

  function selectChannel(channel: Channel): void {
    chatState.selectChannel(channel)
  }
</script>

<div>
  <li class="channel-item">
    <button class="channel-button" onclick={() => selectChannel(channel)}>
      {channel.name}
      <UnreadNotificationBadge
        shouldShow={notificationState.getTotalUnreadDirectMessagesForChannel(channel.conversationId)
          .length > 0}
      />
    </button>
  </li>
</div>

<style>
  .channel-item {
    margin-bottom: 0.25rem;
  }

  .channel-button {
    width: 100%;
    padding: 0.375rem 0.5rem;
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
    border-radius: 4px;
    transition: background-color 0.2s;
    color: #888;
  }

  .channel-button:hover {
    background-color: rgba(255, 255, 255, 0.08);
    color: #fff;
  }
</style>
