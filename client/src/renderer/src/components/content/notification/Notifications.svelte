<script lang="ts">
  import { chatState } from '$src/states/ChatState.svelte.js'
  import { chatService } from '$src/services/ChatService'
  import type { Notification } from '$src/interfaces/Notification'
  import { NotificationType } from '$src/interfaces/Notification'
  import { formatTimestamp } from '$src/utils/DateUtils'
  import { notificationService } from '$src/services/NotificationService'
  import { marginService } from '$src/services/MarginService'
  import Icon from '$src/components/common/icons/Icon.svelte'
  import { marginInviteService, type PendingInvite } from '$src/services/MarginInviteService'
  import { notificationState } from '$src/states/NotificationState.svelte'

  let notifications = $state<Notification[]>([])
  let isLoading = $state(true)
  type NotificationTab = 'all' | 'invites'
  let activeTab = $state<NotificationTab>('all')
  let pendingInvites = $state<PendingInvite[]>([])
  let invitesLoading = $state(true)

  $effect(() => {
    let notificationVersion = notificationState.notificationVersion
    notificationService.getAll().then((result) => {
      console.log(result)
      notifications = [...result]
      isLoading = false
    })
  })

  $effect(() => {
    if (activeTab === 'invites') {
      marginInviteService.getPendingInvites().then((result) => {
        pendingInvites = result
        invitesLoading = false
      })
    }
  })

  async function handleAcceptInvite(invite: PendingInvite): Promise<void> {
    try {
      const margin = await marginInviteService.acceptDirectInvite(invite.id)
      pendingInvites = pendingInvites.filter((i) => i.id !== invite.id)
      marginService.addNewMargin(margin)
    } catch (e) {
      console.error('Failed to accept invite:', e)
    }
  }

  async function handleDeclineInvite(invite: PendingInvite): Promise<void> {
    try {
      await marginInviteService.declineDirectInvite(invite.id)
      pendingInvites = pendingInvites.filter((i) => i.id !== invite.id)
    } catch (e) {
      console.error('Failed to decline invite:', e)
    }
  }

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
    } else if (notification.type === NotificationType.ADDED_TO_MARGIN) {
      chatState.selectMargin(await marginService.getMargin(notification.marginId))
      chatState.currentlySelectedContent = 'margin'
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

  async function handleAcceptFromNotification(notification: Notification): Promise<void> {
    try {
      const margin = await marginInviteService.acceptDirectInvite(notification.referenceId)
      marginService.addNewMargin(margin)

      await notificationService.markNotificationAsSeen(notification)
      notifications = notifications.map((n) =>
        n.notificationId === notification.notificationId ? { ...n, seen: true } : n
      )
      pendingInvites = pendingInvites.filter((i) => i.id !== notification.referenceId)
    } catch (e) {
      console.error('Failed to accept invite:', e)
    }
  }

  async function handleDeclineFromNotification(notification: Notification): Promise<void> {
    try {
      await marginInviteService.declineDirectInvite(notification.referenceId)

      await notificationService.markNotificationAsSeen(notification)
      notifications = notifications.map((n) =>
        n.notificationId === notification.notificationId ? { ...n, seen: true } : n
      )
      pendingInvites = pendingInvites.filter((i) => i.id !== notification.referenceId)
    } catch (e) {
      console.error('Failed to decline invite:', e)
    }
  }

  const unread = $derived(notifications.filter((n) => !n.seen).length)
</script>

<div class="notifications-page">
  <div class="notifications-header">
    <h1 class="page-title">Notifications</h1>
    {#if unread > 0 && activeTab === 'all'}
      <span class="unread-badge">{unread} new</span>
    {/if}
    {#if pendingInvites.length > 0 && activeTab === 'invites'}
      <span class="unread-badge">{pendingInvites.length} pending</span>
    {/if}
  </div>

  <div class="tab-bar">
    <button class="tab" class:active={activeTab === 'all'} onclick={() => (activeTab = 'all')}>
      All
    </button>
    <button
      class="tab"
      class:active={activeTab === 'invites'}
      onclick={() => (activeTab = 'invites')}
    >
      Invites
    </button>
  </div>

  {#if activeTab === 'all'}
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
                <button
                  class="accept-btn"
                  onclick={() => handleAcceptFromNotification(notification)}>Accept</button
                >
                <button
                  class="decline-btn"
                  onclick={() => handleDeclineFromNotification(notification)}>Decline</button
                >
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
  {:else if invitesLoading}
    <div class="empty-state">Loading...</div>
  {:else if pendingInvites.length === 0}
    <div class="empty-state">
      <Icon name="notifications" size={40} strokeWidth={1.5} color="#ddd" />
      <span>No pending invites</span>
    </div>
  {:else}
    <div class="notification-list">
      {#each pendingInvites as invite (invite.id)}
        <div class="invite-item">
          <div class="invite-body">
            <div class="invite-title">
              {invite.invitedByUsername} invited you to {invite.marginName}
            </div>
            <div class="invite-date">{formatTimestamp(invite.createdAt)}</div>
          </div>
          <div class="invite-actions">
            <button class="accept-btn" onclick={() => handleAcceptInvite(invite)}>Accept</button>
            <button class="decline-btn" onclick={() => handleDeclineInvite(invite)}>Decline</button>
          </div>
        </div>
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

  .tab-bar {
    display: flex;
    gap: 0;
    margin-bottom: 16px;
    border: 1px solid #ece8e0;
    border-radius: 10px;
    overflow: hidden;
  }

  .tab {
    flex: 1;
    padding: 8px 0;
    font-size: 13px;
    font-weight: 500;
    font-family: inherit;
    color: #888;
    background: #fafafa;
    border: none;
    cursor: pointer;
    transition: all 0.15s;
  }

  .tab.active {
    color: #e8712a;
    background: white;
    font-weight: 600;
  }

  .tab:not(.active):hover {
    background: #f2f2f2;
  }

  .invite-item {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 16px;
    border-radius: 12px;
    background: #fff4ee;
    width: 100%;
    box-sizing: border-box;
  }

  .invite-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }

  .invite-title {
    font-size: 13px;
    font-weight: 600;
    color: #1a1a1a;
  }

  .invite-date {
    font-size: 11px;
    color: #bbb;
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
