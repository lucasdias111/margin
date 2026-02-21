<script lang="ts">
  import { chatState } from '$src/states/ChatState.svelte'
  import UnreadNotificationBadge from '$src/components/chat/UnreadNotificationBadge.svelte'
  import { notificationState } from '$src/states/NotificationState.svelte'
  import type { RecentChatUsers } from '$src/interfaces/RecentChatUsers'
  import UserAvatar from '$src/components/user/UserAvatar.svelte'
  import { encryptionService } from '$src/services/EncryptionService'

  interface Props {
    recentUser: RecentChatUsers
    isSelected: boolean
  }

  let decryptedMessage = $state('')
  let { recentUser, isSelected = false }: Props = $props()
  const { user: chatUser, lastMessage, lastMessageTime } = $derived(recentUser)

  $effect(() => {
    encryptionService.decryptMessage(lastMessage, true).then((result) => {
      decryptedMessage = result
    })
  })
  const unreadCount = $derived(notificationState.getTotalUnreadDirectMessagesForUser(chatUser.id))

  function formatTime(dateTime: string): string {
    return new Date(dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
</script>

<button
  class="user-button"
  class:selected={isSelected}
  onclick={() => chatState.selectUser(chatUser)}
>
  <div class="avatar">
    {#if chatUser.profilePictureUrl}
      <UserAvatar profilePictureUrl={chatUser.profilePictureUrl} />
    {:else}
      <span class="avatar-initials">
        {chatUser.username.slice(0, 2).toUpperCase()}
      </span>
    {/if}
  </div>

  <div class="user-info">
    <div class="top-row">
      <span class="username">{chatUser.username}</span>
      {#if lastMessageTime}
        <span class="timestamp">{formatTime(lastMessageTime)}</span>
      {/if}
    </div>
    <div class="bottom-row">
      <span class="last-message">{decryptedMessage}</span>
      {#if unreadCount > 0}
        <UnreadNotificationBadge shouldShow={true} count={unreadCount} />
      {/if}
    </div>
  </div>
</button>

<style>
  .user-button {
    width: 100%;
    background: none;
    border: none;
    border-bottom: 1px solid #e5e5e5;
    border-radius: 0;
    appearance: none;
    -webkit-appearance: none;
    box-shadow: none;
    outline: none;
    padding: 12px 16px;
    text-align: left;
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    color: #0f0f0f;
    transition: background 0.15s ease;
  }

  .user-button:hover {
    background: #f5f0e8;
  }

  .avatar {
    width: 46px;
    height: 46px;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;
    background: #e0d8cc;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .avatar-initials {
    font-size: 0.85rem;
    font-weight: 600;
    color: #6b5f4e;
  }

  .user-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 3px;
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

  .username {
    font-size: 0.95rem;
    font-weight: 700;
    color: #111;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .timestamp {
    font-size: 0.75rem;
    color: #999;
    flex-shrink: 0;
    margin-left: 8px;
  }

  .last-message {
    font-size: 0.82rem;
    color: #888;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
  }
</style>
