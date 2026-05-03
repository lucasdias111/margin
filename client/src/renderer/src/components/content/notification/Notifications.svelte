<script lang="ts">
  import { chatService } from '$src/services/ChatService'
  import type { Notification } from '$src/interfaces/Notification'
  import { NotificationType } from '$src/interfaces/Notification'
  import { formatTimestamp } from '$src/utils/DateUtils'
  import { notificationService } from '$src/services/NotificationService'
  import { marginService } from '$src/services/MarginService'
  import Icon from '$src/components/common/icons/Icon.svelte'
  import { marginInviteService } from '$src/services/MarginInviteService'
  import { notificationState } from '$src/states/NotificationState.svelte'
  import { View } from '$src/interfaces/View'
  import { usersService } from '$src/services/UsersService'
  import { navigationService } from '$src/services/NavigationService'

  const notifications = $derived(notificationState.notifications)
  const isLoading = $derived(!notificationState.notificationsLoaded)
  const unread = $derived(notifications.filter((n) => !n.seen).length)

  async function handleAcceptFromNotification(notification: Notification): Promise<void> {
    try {
      const margin = await marginInviteService.acceptDirectInvite(notification.referenceId)
      marginService.addNewMargin(margin)
      await notificationService.markNotificationAsSeen(notification)
      notificationState.markNotificationSeen(notification.notificationId)
    } catch (e) {
      console.error('Failed to accept invite:', e)
    }
  }

  async function handleDeclineFromNotification(notification: Notification): Promise<void> {
    try {
      await marginInviteService.declineDirectInvite(notification.referenceId)
      await notificationService.markNotificationAsSeen(notification)
      notificationState.markNotificationSeen(notification.notificationId)
    } catch (e) {
      console.error('Failed to decline invite:', e)
    }
  }

  async function handleClick(notification: Notification): Promise<void> {
    if (!notification.seen) {
      await notificationService.markNotificationAsSeen(notification)
      notificationState.markNotificationSeen(notification.notificationId)
    }

    if (notification.type === NotificationType.ANNOUNCEMENT) {
      marginService.select(await marginService.getMargin(notification.marginId))
      navigationService.setView(View.Margin)
    } else if (notification.type === NotificationType.MISSED_CALL) {
      await chatService.loadConversationForUser(notification.sender)
      usersService.select(notification.sender)
      navigationService.setView(View.Private)
    } else if (notification.type === NotificationType.ADDED_TO_MARGIN) {
      marginService.select(await marginService.getMargin(notification.marginId))
      navigationService.setView(View.Margin)
    }
  }

  function getNotificationIcon(type: NotificationType): string {
    switch (type) {
      case NotificationType.ANNOUNCEMENT:
        return '📢'
      case NotificationType.MISSED_CALL:
        return '📞'
      case NotificationType.ADDED_TO_MARGIN:
        return '👥'
      case NotificationType.INVITED_TO_MARGIN:
        return '✉️'
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
      case NotificationType.ADDED_TO_MARGIN:
        return `${notification.sender?.displayName ?? 'Someone'} added you to a margin`
      case NotificationType.INVITED_TO_MARGIN:
        return `${notification.sender?.displayName ?? 'Someone'} invited you to join a margin`
      default:
        return 'New notification'
    }
  }
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
      <Icon name="notifications" size={40} strokeWidth={1.5} color="#ddd" />
      <span>No notifications yet</span>
    </div>
  {:else}
    <div class="notification-list">
      {#each notifications as notification (notification.notificationId)}
        {#if notification.type === NotificationType.INVITED_TO_MARGIN && !notification.seen}
          <div class="notification-item unseen invite-notification">
            <div class="notification-icon">
              {getNotificationIcon(notification.type)}
            </div>
            <div class="notification-body">
              <div class="notification-title">{getNotificationTitle(notification)}</div>
              <div class="notification-date">{formatTimestamp(notification.createdAt)}</div>
            </div>
            <div class="invite-actions">
              <button class="accept-btn" onclick={() => handleAcceptFromNotification(notification)}
              >Accept
              </button>
              <button
                class="decline-btn"
                onclick={() => handleDeclineFromNotification(notification)}
              >Decline
              </button>
            </div>
          </div>
        {:else}
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
        {/if}
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
    background: #ff843c;
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
    background: #ff843c;
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

  .invite-actions {
    display: flex;
    gap: 6px;
    flex-shrink: 0;
  }

  .accept-btn {
    padding: 6px 14px;
    background: #e8712a;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
  }

  .accept-btn:hover {
    background: #d4621a;
  }

  .decline-btn {
    padding: 6px 14px;
    background: none;
    color: #888;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 500;
    font-family: inherit;
    cursor: pointer;
  }

  .decline-btn:hover {
    border-color: #c0392b;
    color: #c0392b;
  }

  .invite-notification {
    cursor: default;
    box-sizing: border-box;
  }
</style>
