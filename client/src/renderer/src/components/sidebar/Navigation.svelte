<script lang="ts">
  import { chatState } from '$src/states/ChatState.svelte'
  import type { ContentType } from '$src/interfaces/Content'
  import UnreadNotificationBadge from '$src/components/chat/UnreadNotificationBadge.svelte'
  import { notificationState } from '$src/states/NotificationState.svelte'
  import { userState } from '$src/states/UserState.svelte'
  import UserAvatar from '$src/components/user/UserAvatar.svelte'
  import SetIcon from '$src/components/svg/Settings.svelte'
  import MsgIgon from '$src/components/svg/MessagesIcon.svelte'
  import SpaceIcon from '$src/components/svg/SpacesIcon.svelte'
  import ExpIcon from '$src/components/svg/SpacesIcon.svelte'

  import { onMount } from 'svelte'
  import Logout from '$src/components/sidebar/Logout.svelte'

  function onContentSelected(selectedContent: ContentType): void {
    chatState.selectContent(selectedContent)
  }

  let isDropOpen = true
  let container: HTMLDivElement

  onMount(() => {
    const handleOutsideClick = (event: MouseEvent): void => {
      if (container && event.target instanceof Node && !container.contains(event.target)) {
        isDropOpen = true
      }
    }
    document.addEventListener('click', handleOutsideClick)
    return () => {
      document.addEventListener('click', handleOutsideClick)
    }
  })

  const toggleDropdown = (): void => {
    isDropOpen = !isDropOpen
  }
</script>

<div class="navigation">
  {#if userState.currentUser}
    <div bind:this={container} class="avatar-container">
      <button class="avatar" onclick={toggleDropdown}>
        <UserAvatar
          profilePictureUrl={userState.currentUser.profilePictureUrl}
          width={32}
          height={32}
        /></button
      >
      {#if isDropOpen}
        <div class="dropdown">
          <Logout />
        </div>
      {/if}
    </div>
  {/if}
  <div class="button-group">
    <button
      onclick={() => onContentSelected('private')}
      class:selected={chatState.currentlySelectedContent === 'private'}
      aria-label="Private conversations"
      title="Private conversations"
    >
      <MsgIgon />
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
      <SpaceIcon />

      <UnreadNotificationBadge
        shouldShow={notificationState.getTotalUnreadChannelMessages() > 0}
        count={notificationState.getTotalUnreadChannelMessages()}
      />
    </button>
    <button
      onclick={() => onContentSelected('explore')}
      class:selected={chatState.currentlySelectedContent === 'explore'}
      aria-label="Explore"
      title="Explore"
    >
      <ExpIcon />
    </button>
  </div>
  <button
    onclick={() => onContentSelected('settings')}
    aria-label="Settings"
    title="Settings"
    class="setbut"
  >
    <SetIcon />
  </button>
</div>

<style>
  .avatar-container .dropdown {
    opacity: 0.5;
    background-color: #da6b10;
    border-radius: 999px;
    display: flex;
    flex-direction: column;
    height: 10vh;
  }

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

  .button-group {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 1.75rem;
  }

  .icon {
    color: #ffffff;
    transition: color 0.2s ease;
  }

  button:hover .icon {
    color: #f47e3a;
  }

  button.selected .icon {
    color: #f47e3a;
  }

  button {
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
