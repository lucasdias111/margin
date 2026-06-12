<script lang="ts">
  import { View } from '$src/interfaces/View'
  import UnreadNotificationBadge from '$src/components/common/chat/UnreadNotificationBadge.svelte'
  import { notificationState } from '$src/states/NotificationState.svelte.js'
  import UserAvatar from '$src/components/common/user/UserAvatar.svelte'
  import { authenticationService } from '$src/services/AuthenticationService'
  import { push } from 'svelte-spa-router'
  import { clickOutside } from '$src/actions/clickOutside'
  import Icon from '$src/components/common/icons/Icon.svelte'
  import BugReportModal from '$src/components/common/modals/BugReportModal.svelte'
  import { usersService } from '$src/services/UsersService'
  import { isElectron } from '$src/utils/platformUtils'
  import { navigationState } from '$src/states/NavigationState.svelte'
  import { sessionState } from '$src/states/SessionState.svelte'
  import { notificationService } from '$src/services/NotificationService'
  import { navigationService } from '$src/services/NavigationService'

  function onContentSelected(selectedContent: View): void {
    navigationService.setView(selectedContent)
  }

  async function handleLogout(): Promise<void> {
    if (!sessionState.currentUser?.id) return
    await authenticationService.logoutUser()
    await push('/')
  }

  let showDropdown = $state(false)
  let bugReportOpen = $state(false)

  const totalAnnouncements = $derived(notificationState.getTotalUnseenNotifications())
  const directUnread = $derived(notificationService.totalUnreadDirectMessages())
  const channelUnread = $derived(notificationService.totalUnreadChannelMessages())
</script>

<div class="navigation">
  {#if sessionState.currentUser}
    <div class="avatar-wrapper" use:clickOutside={() => (showDropdown = false)}>
      <button
        class="avatar-btn"
        data-tour="avatar-btn"
        onclick={() => {
          showDropdown = !showDropdown
        }}
      >
        <UserAvatar
          profilePictureUrl={sessionState.currentUser.profilePictureUrl}
          width={40}
          height={40}
        />
      </button>
      {#if showDropdown}
        <div class="dropdown">
          <div class="dropdown-header">
            <span class="dropdown-displayname">{sessionState.currentUser.displayName}</span>
          </div>
          <div class="divider"></div>
          <button
            class="dropdown-item"
            onclick={() => {
              onContentSelected(View.Settings)
              showDropdown = false
            }}
            class:selected={navigationState.view === View.Settings}
            aria-label="Settings"
            title="Settings"
          >
            <span class="item-label">Settings</span>
            <Icon name="settings"></Icon>
          </button>

          {#if !isElectron()}
            <a
              class="dropdown-item"
              href="https://margin.chat/download"
              target="_blank"
              rel="noopener noreferrer"
              onclick={() => (showDropdown = false)}
            >
              <span class="item-label">Download desktop app</span>
              <Icon name="download" size={16} />
            </a>
          {/if}
          <div class="divider"></div>
          <button
            class="dropdown-item"
            onclick={() => {
              bugReportOpen = true
              showDropdown = false
            }}
          >
            <span class="logout-label">Report bug</span>
            <Icon name="bug" size={20} />
          </button>
          <button
            class="dropdown-item"
            onclick={() => {
              handleLogout()
              showDropdown = false
            }}
          >
            <span class="logout-label">Log out</span>
            <Icon name="logout" size={16} />
          </button>
        </div>
      {/if}
      <BugReportModal
        open={bugReportOpen}
        onClose={() => (bugReportOpen = false)}
        onSubmit={async (report) => {
          await usersService.reportBug(report.title, report.description)
        }}
      />
    </div>
  {/if}

  <div class="button-group">
    <button
      class="nav-btn"
      onclick={() => onContentSelected(View.Notifications)}
      class:selected={navigationState.view === View.Notifications}
      aria-label="Notifications"
      title="Notifications"
    >
      <Icon name="notifications" size={28} />
      <UnreadNotificationBadge shouldShow={totalAnnouncements > 0} count={totalAnnouncements} />
      <span class="nav-label">Notifications</span>
    </button>
    <button
      class="nav-btn"
      data-tour="nav-private"
      onclick={() => onContentSelected(View.Private)}
      class:selected={navigationState.view === View.Private}
      aria-label="Private conversations"
      title="Private conversations"
    >
      <Icon name="messages" size={28} />
      <UnreadNotificationBadge shouldShow={directUnread > 0} count={directUnread} />
      <span class="nav-label">Private Chats</span>
    </button>
    <button
      class="nav-btn"
      data-tour="nav-margin"
      onclick={() => onContentSelected(View.Margin)}
      class:selected={navigationState.view === View.Margin}
      aria-label="Spaces"
      title="Spaces"
    >
      <Icon name="users" size={28} />
      <UnreadNotificationBadge shouldShow={channelUnread > 0} count={channelUnread} />
      <span class="nav-label">Margins</span>
    </button>
  </div>
  <div class="avatar-space"></div>
</div>

<style>
  .navigation {
    width: 100px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    background-color: #2d2d2d;
    border-radius: 20px;
    padding: 20px;
    box-sizing: border-box;
    flex-shrink: 0;
    overflow: visible;
  }

  @media (max-width: 768px) {
    .navigation {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      width: 100%;
      height: 64px;
      flex-direction: row;
      padding: 0 12px;
      border-radius: 0;
      z-index: 50;
      justify-content: space-between;
    }

    .navigation .button-group {
      flex-direction: row;
      gap: 1.5rem;
      flex: 1;
      justify-content: center;
    }

    .navigation .avatar-space {
      display: block;
      width: 40px;
      height: 40px;
    }

    .navigation .dropdown {
      left: 0;
      top: auto;
      bottom: calc(100% + 8px);
      transform-origin: bottom left;
    }

    .navigation .nav-label {
      font-size: 8px;
    }
  }

  .avatar-btn {
    background: none;
    padding: 0;
    cursor: pointer;
    border: none;
    border-radius: 50%;
    transition: transform 0.2s ease,
    opacity 0.2s ease;
    opacity: 0.85;
  }

  .avatar-btn:hover {
    transform: scale(1.08);
    opacity: 1;
  }

  @keyframes dropdownIn {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(-4px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  .dropdown {
    position: absolute;
    left: calc(100% + 14px);
    top: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
    background-color: #2a2a2a;
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 12px;
    padding: 6px;
    min-width: 200px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    z-index: 100;
    animation: dropdownIn 0.15s ease-out;
    transform-origin: top left;
  }

  .dropdown-header {
    padding: 8px 10px 6px;
  }

  .dropdown-displayname {
    font-size: 12px;
    font-weight: 600;
    color: #aaa;
    letter-spacing: 0.03em;
    text-transform: uppercase;
  }

  .divider {
    height: 1px;
    background-color: rgba(255, 255, 255, 0.07);
    margin: 4px 0;
  }

  .dropdown-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 10px;
    border-radius: 8px;
    transition: background-color 0.15s ease;
    cursor: pointer;
    width: 100%;
    box-sizing: border-box;
    text-decoration: none;
  }

  .dropdown-item:hover {
    background-color: rgba(255, 255, 255, 0.06);
  }

  .item-label {
    font-size: 13px;
    color: #ddd;
    font-weight: 500;
  }

  .logout-label {
    font-size: 13px;
    color: #ddd;
    font-weight: 500;
  }

  .dropdown-item:hover .item-label,
  .dropdown-item:hover .logout-label {
    color: #ff843c;
  }

  .dropdown-item :global(svg) {
    color: #ddd;
    width: 16px;
    height: 16px;
  }

  .dropdown-item:hover :global(svg) {
    color: #ff843c;
  }

  .button-group {
    display: flex;
    justify-content: center;
    flex-direction: column;
    gap: 2.5rem;
  }

  .nav-btn {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .nav-label {
    font-size: 9px;
    font-weight: 500;
    letter-spacing: 0.4px;
    text-transform: uppercase;
    color: #666;
    transition: color 0.15s ease;
  }

  .nav-btn:hover .nav-label,
  .nav-btn.selected .nav-label {
    color: #ff843c;
  }

  button :global(svg) {
    display: block;
    color: #888;
    transition: color 0.15s ease;
  }

  button:hover :global(svg),
  button.selected :global(svg) {
    color: #ff843c;
  }

  button {
    position: relative;
    background: none;
    border: none;
    padding: 0;
    margin: 0;
    cursor: pointer;
    appearance: none;
    box-shadow: none;
    outline: none;
    -webkit-appearance: none;
  }

  .avatar-space {
    width: 32px;
    height: 32px;
  }

  .avatar-wrapper {
    position: relative;
  }
</style>
