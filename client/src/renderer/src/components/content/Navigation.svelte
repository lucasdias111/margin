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

  function onContentSelected(selectedContent: ContentType): void {
    chatService.selectContent(selectedContent)
  }

  async function handleLogout(): Promise<void> {
    if (!userState.currentUser?.id) return
    await authenticationService.logoutUser()
    await push('/')
  }

  let showDropdown = $state(false)

  const totalAnnouncements = $derived(notificationState.getTotalUnseenNotifications())
</script>

<div class="navigation">
  {#if userState.currentUser}
    <div class="avatar-wrapper" use:clickOutside={() => (showDropdown = false)}>
      <button class="avatar-btn" onclick={() => (showDropdown = !showDropdown)}>
        <UserAvatar
          profilePictureUrl={userState.currentUser.profilePictureUrl}
          width={32}
          height={32}
        />
      </button>
      {#if showDropdown}
        <div class="dropdown">
          <div class="dropdown-header">
            <span class="dropdown-displayname">{userState.currentUser.displayName}</span>
          </div>
          <div class="divider"></div>
          <button class="dropdown-item" onclick={handleLogout}>
            <span class="item-label">Log out</span>
            <Icon name="logout" size={16} />
          </button>
        </div>
      {/if}
    </div>
  {/if}

  <div class="button-group">
    <button
      onclick={() => onContentSelected('notifications')}
      class:selected={chatState.currentlySelectedContent === 'notifications'}
      aria-label="Notifications"
      title="Notifications"
    >
      <Icon name="notifications" size={28} />
      <UnreadNotificationBadge shouldShow={totalAnnouncements > 0} count={1} />
    </button>
    <button
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
    </button>
    <button
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
    </button>
  </div>

  <button
    onclick={() => onContentSelected('settings')}
    class:selected={chatState.currentlySelectedContent === 'settings'}
    aria-label="Settings"
    title="Settings"
    class="setbut"
  >
    <Icon name="settings" size={28} />
  </button>
</div>

<style>
  .navigation {
    width: 80px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    background-color: #2d2d2d;
    border-radius: 20px;
    padding: 20px;
    box-sizing: border-box;
    flex-shrink: 0;
  }

  .avatar-wrapper {
    position: relative;
  }

  .avatar-btn {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    border-radius: 999px;
    transition: opacity 0.15s ease;
  }

  .avatar-btn:hover {
    opacity: 0.8;
  }

  .dropdown {
    position: absolute;
    left: calc(100% + 14px);
    top: 0;
    background-color: #2a2a2a;
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 12px;
    padding: 6px;
    min-width: 180px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    z-index: 100;
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
    color: #e05a5a;
    font-weight: 500;
  }

  .dropdown-item :global(svg) {
    color: #e05a5a;
    width: 16px;
    height: 16px;
  }

  .button-group {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 4rem;
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
</style>
