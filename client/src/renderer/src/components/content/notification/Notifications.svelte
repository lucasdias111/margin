<script lang="ts">
  import { chatState } from '$src/states/ChatState.svelte.js'
  import { chatService } from '$src/services/ChatService'
  import type { Notification } from '$src/interfaces/Notification'
  import { NotificationType } from '$src/interfaces/Notification'
  import { formatTimestamp } from '$src/utils/DateUtils'
  import { notificationService } from '$src/services/NotificationService'
  import { marginService } from '$src/services/MarginService'

  let notifications = $state<Notification[]>([])
  let isLoading = $state(true)

  $effect(() => {
    notificationService.getAll().then((result) => {
      notifications = result
      isLoading = false
    })
  })

  async function handleClick(notification: Notification): Promise<void> {
    if (!notification.seen) {
      await notificationService.markNotificationAsSeen(notification)
      notifications = notifications.map((n) =>
        n.notificationId === notification.notificationId ? { ...n, seen: true } : n
      )
    }

    if (notification.type === NotificationType.ANNOUNCEMENT) {
      chatState.selectMargin(await marginService.getMargin(notification.marginId))
      chatState.currentlySelectedContent = 'margin'
    } else if (notification.type === NotificationType.MISSED_CALL) {
      await chatService.loadConversationForUser(notification.sender)
      chatState.selectUser(notification.sender)
      chatState.currentlySelectedContent = 'private'
    }
  }

  function getNotificationIcon(type: NotificationType): string {
    switch (type) {
      case NotificationType.ANNOUNCEMENT:
        return '📢'
      case NotificationType.MISSED_CALL:
        return '📞'
      default:
        return '🔔'
    }
  }

  function getNotificationTitle(notification: Notification): string {
    switch (notification.type) {
      case NotificationType.ANNOUNCEMENT:
        return `New announcement from ${notification.sender?.displayName ?? 'Admin'}`
      case NotificationType.MISSED_CALL:
        return `Missed call from ${notification.sender?.displayName ?? 'Unknown'}`
      default:
        return 'New notification'
    }
  }

  const unread = $derived(notifications.filter((n) => !n.seen).length)
</script>

<div class="notifications-page">
  <div class="notifications-header">
    <h1 class="page-title">Notifications</h1>
    {#if unread > 0}
      <span class="unread-badge">{unread} new</span>
    {/if}
  </div>

  {#if isLoading}
    <div class="empty-state">Loading...</div>
  {:else if notifications.length === 0}
    <div class="empty-state">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ddd" stroke-width="1.5">
        <path
          d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"
        />
      </svg>
      <span>No notifications yet</span>
    </div>
  {:else}
    <div class="notification-list">
      {#each notifications as notification (notification.notificationId)}
        <button
          class="notification-item"
          class:unseen={!notification.seen}
          onclick={() => handleClick(notification)}
        >
          <div class="notification-icon">
            {getNotificationIcon(notification.type)}
          </div>
          <div class="notification-body">
            <div class="notification-title">{getNotificationTitle(notification)}</div>
            <div class="notification-date">{formatTimestamp(notification.createdAt)}</div>
          </div>
          {#if !notification.seen}
            <div class="unseen-dot"></div>
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .notifications-page {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: white;
    border-radius: 15px;
    padding: 28px;
    overflow-y: auto;
    min-height: 0;
  }

  .notifications-page::-webkit-scrollbar {
    width: 4px;
  }
  .notifications-page::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.08);
    border-radius: 4px;
  }

  .notifications-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  }

  .page-title {
    font-size: 18px;
    font-weight: 700;
    color: #1a1a1a;
    margin: 0;
  }

  .unread-badge {
    font-size: 11px;
    font-weight: 700;
    color: white;
    background: #f47e3a;
    border-radius: 999px;
    padding: 3px 10px;
    letter-spacing: 0.03em;
  }

  .notification-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .notification-item {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 16px;
    border-radius: 12px;
    background: #f7f7fa;
    border: none;
    cursor: pointer;
    text-align: left;
    transition: background 0.15s;
    width: 100%;
  }

  .notification-item:hover {
    background: #f0f0f5;
  }

  .notification-item.unseen {
    background: #fff4ee;
  }

  .notification-item.unseen:hover {
    background: #ffe8d6;
  }

  .notification-icon {
    font-size: 20px;
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
    border-radius: 10px;
  }

  .notification-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }

  .notification-title {
    font-size: 13px;
    font-weight: 600;
    color: #1a1a1a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .notification-date {
    font-size: 11px;
    color: #bbb;
  }

  .unseen-dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: #f47e3a;
    flex-shrink: 0;
  }

  .empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    color: #ccc;
    font-size: 13px;
  }
</style>
