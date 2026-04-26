<script lang="ts">
  import UnreadNotificationBadge from '$src/components/common/chat/UnreadNotificationBadge.svelte'
  import { notificationService } from '$src/services/NotificationService'
  import type { Conversation } from '$src/interfaces/Conversation'
  import type { User } from '$src/interfaces/User'
  import type { ConversationMeta } from '$src/states/ConversationsState.svelte.js'
  import UserAvatar from '$src/components/common/user/UserAvatar.svelte'
  import { formatTime } from '$src/utils/DateUtils'
  import { usersService } from '$src/services/UsersService'

  interface RecentUserEntry {
    conversation: Conversation
    user: User
    meta: ConversationMeta
  }

  interface Props {
    recentUser: RecentUserEntry
    isSelected: boolean
    isOnline: boolean
  }

  let { recentUser, isSelected = false, isOnline }: Props = $props()
  const chatUser = $derived(recentUser.user)
  const meta = $derived(recentUser.meta)

  const unreadCount = $derived(notificationService.isUnread(recentUser.conversation.id) ? 1 : 0)
</script>

<button
  class="user-button"
  class:selected={isSelected}
  onclick={() => usersService.select(chatUser)}
>
  <div class="avatar">
    {#if chatUser.profilePictureUrl}
      <UserAvatar profilePictureUrl={chatUser.profilePictureUrl} />
    {:else}
      <span class="avatar-initials">
        {chatUser.displayName.slice(0, 2).toUpperCase()}
      </span>
    {/if}
    <span class="presence-dot" class:online={isOnline}></span>
  </div>

  <div class="user-info">
    <div class="top-row">
      <span class="handle">{chatUser.displayName}</span>
      {#if meta.lastMessageTime}
        <span class="timestamp">{formatTime(meta.lastMessageTime)}</span>
      {/if}
    </div>
    <div class="bottom-row">
      <span class="last-message">{meta.lastMessage}</span>
      {#if unreadCount > 0}
        <UnreadNotificationBadge shouldShow={true} count={1} variant="inline" />
      {/if}
    </div>
  </div>
</button>

<style>
  .user-button {
    width: 100%;
    background: none;
    border: none;
    border-radius: 12px;
    appearance: none;
    -webkit-appearance: none;
    box-shadow: none;
    outline: none;
    padding: 9px 10px;
    text-align: left;
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    color: #0f0f0f;
    transition: background 0.15s ease;
  }

  .user-button:hover:not(.selected) {
    background: rgba(0, 0, 0, 0.04);
  }

  .user-button.selected {
    background: rgba(168, 80, 26, 0.1);
  }

  .user-button.selected .handle {
    color: #e8712aff;
  }

  .user-button.selected .timestamp,
  .user-button.selected .last-message {
    color: #c45a18;
    opacity: 0.7;
  }

  .avatar {
    position: relative;
    width: 38px;
    height: 38px;
    border-radius: 9px;
    overflow: hidden;
    flex-shrink: 0;
    background: #f2ede6;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .avatar-initials {
    font-size: 0.8rem;
    font-weight: 600;
    color: #8a7560;
  }

  .user-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .top-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .bottom-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .handle {
    font-size: 14px;
    font-weight: 550;
    color: #2a2a2a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .timestamp {
    font-size: 11px;
    font-weight: 500;
    color: #bbb;
    flex-shrink: 0;
    margin-left: 8px;
  }

  .last-message {
    font-size: 14px;
    color: #c1c1c1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
  }

  .presence-dot {
    position: absolute;
    bottom: 1px;
    right: 1px;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: #ddd;
    border: 2px solid white;
  }

  .presence-dot.online {
    background: #3dd68c;
  }
</style>
