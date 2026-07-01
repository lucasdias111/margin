<script lang="ts">
  import type { Snippet } from 'svelte'
  import UnreadNotificationBadge from '$src/components/common/chat/UnreadNotificationBadge.svelte'
  import Icon from '$src/components/common/icons/Icon.svelte'
  import Tooltip from '$src/components/common/Tooltip.svelte'

  interface Props {
    name: string
    lastMessage: string | null
    lastMessageTime: string | null
    unreadCount: number
    isSelected: boolean
    isSecret?: boolean
    onclick: () => void
    avatar: Snippet
    class?: string
  }

  let {
    name,
    lastMessage,
    lastMessageTime,
    unreadCount,
    isSelected,
    isSecret = false,
    onclick,
    avatar,
    class: extraClass
  }: Props = $props()
</script>

<button class="entry {extraClass ?? ''}" class:selected={isSelected} {onclick}>
  <span class="avatar-wrap">
    {@render avatar()}
  </span>
  <span class="info">
    <span class="top-row">
      <span class="name" class:unread={unreadCount > 0}>{name}</span>
      {#if isSecret}
        <Tooltip
          text="End-to-end encrypted: only chat members can read these messages"
        >
          <span class="secret-indicator">
            <Icon name="lock" size={9} />
          </span>
        </Tooltip>
      {/if}
      {#if lastMessageTime}
        <span class="timestamp">{lastMessageTime}</span>
      {/if}
    </span>
    <span class="bottom-row">
      {#if lastMessage}
        <span class="last-message" class:unread={unreadCount > 0}>{lastMessage}</span>
      {/if}
      <UnreadNotificationBadge shouldShow={unreadCount > 0} count={1} variant="inline" />
    </span>
  </span>
</button>

<style>
  .entry {
    width: 100%;
    background: none;
    border: none;
    border-radius: 10px;
    padding: 8px 10px;
    text-align: left;
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    font-family: inherit;
    color: #0f0f0f;
    transition: background 0.15s ease;
    user-select: none;
  }

  .entry:hover:not(.selected) {
    background: rgba(0, 0, 0, 0.04);
  }

  .entry.selected {
    background: #fff0eb;
  }

  .entry.selected .name {
    color: #e8712a;
  }

  .entry.selected .timestamp,
  .entry.selected .last-message {
    color: #c45a18;
    opacity: 0.7;
  }

  .avatar-wrap {
    position: relative;
    width: 38px;
    height: 38px;
    border-radius: 50%;
    flex-shrink: 0;
    background: #f0f0f0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    overflow: visible;
  }

  .entry.selected .avatar-wrap {
    background: #ffd8c8;
  }

  .info {
    flex: 1;
    min-width: 0;
    display: inline-flex;
    flex-direction: column;
    gap: 2px;
  }

  .top-row {
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }

  .bottom-row {
    display: inline-flex;
    justify-content: space-between;
    align-items: center;
  }

  .name {
    font-size: 13px;
    font-weight: 600;
    color: #2a2a2a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
    min-width: 0;
  }

  .name.unread {
    font-weight: 700;
  }

  .secret-indicator {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    font-size: 10px;
    font-weight: 500;
    color: #ff6203;
    flex-shrink: 0;
    white-space: nowrap;
  }

  .timestamp {
    font-size: 11px;
    font-weight: 500;
    color: #bbb;
    flex-shrink: 0;
    margin-left: auto;
  }

  .last-message {
    font-size: 12px;
    color: #888;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
    min-width: 0;
  }

  .last-message.unread {
    font-weight: 600;
    color: #6b6b6b;
  }
</style>
