<script lang="ts">
  import { chatState } from '$src/states/ChatState.svelte.js'
  import type { ContentType } from '$src/interfaces/Content'
  import UnreadNotificationBadge from '$src/components/common/chat/UnreadNotificationBadge.svelte'
  import { notificationState } from '$src/states/NotificationState.svelte.js'
  import { userState } from '$src/states/UserState.svelte.js'
  import UserAvatar from '$src/components/common/user/UserAvatar.svelte'
  import { chatService } from '$src/services/ChatService'
  import { authenticationService } from '$src/services/AuthenticationService'
  import { push } from 'svelte-spa-router'
  import { clickOutside } from '$src/actions/clickOutside'
  import Icon from '$src/components/common/icons/Icon.svelte'
  import BugReportModal from '$src/components/common/modals/BugReportModal.svelte'
  import { userService } from '$src/services/UserService'

  function onContentSelected(selectedContent: ContentType): void {
    chatService.selectContent(selectedContent)
  }

  async function handleLogout(): Promise<void> {
    if (!userState.currentUser?.id) return
    await authenticationService.logoutUser()
    await push('/')
  }

  let showDropdown = $state(false)
  let bugReportOpen = $state(false)

  const totalAnnouncements = $derived(notificationState.getTotalUnseenNotifications())
</script>

<div class="navigation">
  {#if userState.currentUser}
    <div class="avatar-wrapper" use:clickOutside={() => (showDropdown = false)}>
      <button
        class="avatar-btn"
        onclick={() => {
          showDropdown = !showDropdown
        }}
      >
        <UserAvatar
          profilePictureUrl={userState.currentUser.profilePictureUrl}
          width={40}
          height={40}
        />
      </button>
      {#if showDropdown}
        <div class="dropdown">
          <div class="dropdown-header">
            <span class="dropdown-displayname">{userState.currentUser.displayName}</span>
          </div>
          <div class="divider"></div>
          <button
            class="dropdown-item"
            onclick={() => {
              onContentSelected('settings')
              showDropdown = false
            }}
            class:selected={chatState.currentlySelectedContent === 'settings'}
            aria-label="Settings"
            title="Settings"
          >
            <span class="item-label">Settings</span>
            <Icon name="settings"></Icon>
          </button>

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
          await userService.reportBug(report.title, report.description)
        }}
      />
    </div>
  {/if}

  <div class="button-group">
    <button
      class="nav-btn"
      onclick={() => onContentSelected('notifications')}
      class:selected={chatState.currentlySelectedContent === 'notifications'}
      aria-label="Notifications"
      title="Notifications"
    >
      <Icon name="notifications" size={28} />
      <UnreadNotificationBadge shouldShow={totalAnnouncements > 0} count={1} />
      <span class="nav-label">Notifications</span>
    </button>
    <button
      class="nav-btn"
      onclick={() => onContentSelected('private')}
      class:selected={chatState.currentlySelectedContent === 'private'}
      aria-label="Private conversations"
      title="Private conversations"
    >
      <Icon name="messages" size={28} />
      <UnreadNotificationBadge
        shouldShow={notificationState.getTotalUnreadDirectMessages() > 0}
        count={notificationState.getTotalUnreadDirectMessages()}
      />
      <span class="nav-label">Private Chats</span>
    </button>
    <button
      class="nav-btn"
      onclick={() => onContentSelected('margin')}
      class:selected={chatState.currentlySelectedContent === 'margin'}
      aria-label="Spaces"
      title="Spaces"
    >
      <Icon name="users" size={28} />
      <UnreadNotificationBadge
        shouldShow={notificationState.getTotalUnreadChannelMessages() > 0}
        count={notificationState.getTotalUnreadChannelMessages()}
      />
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
    min-width: 180px;
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
    color: #f47e3a;
  }

  .dropdown-item :global(svg) {
    color: #ddd;
    width: 16px;
    height: 16px;
  }

  .dropdown-item:hover :global(svg) {
    color: #f47e3a;
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
    color: #f47e3a;
  }

  button :global(svg) {
    display: block;
    color: #888;
    transition: color 0.15s ease;
  }

  button:hover :global(svg),
  button.selected :global(svg) {
    color: #f47e3a;
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
