<script lang="ts">
  import { chatState } from '$src/states/ChatState.svelte'
  import type { ContentType } from '$src/interfaces/Content'
  import UnreadNotificationBadge from '$src/components/common/chat/UnreadNotificationBadge.svelte'
  import { notificationState } from '$src/states/NotificationState.svelte'
  import { userState } from '$src/states/UserState.svelte'
  import UserAvatar from '$src/components/common/user/UserAvatar.svelte'
  import SetIcon from '$src/components/svg/Settings.svelte'
  import MsgIgon from '$src/components/svg/MessagesIcon.svelte'
  import SpaceIcon from '$src/components/svg/SpacesIcon.svelte'
  import ExpIcon from '$src/components/svg/ExploreIcon.svelte'
  import { onMount } from 'svelte'
  import Logout from '$src/components/authentication/Logout.svelte'

  function onContentSelected(selectedContent: ContentType): void {
    chatState.selectContent(selectedContent)
  }

  let isDropOpen = false
  let container: HTMLDivElement

  onMount(() => {
    const handleOutsideClick = (event: MouseEvent): void => {
      if (container && event.target instanceof Node && !container.contains(event.target)) {
        isDropOpen = false
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
  .avatar-container {
    position: relative;
  }

  .avatar-container .dropdown {
    position: absolute;
    top: 50px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 100;
  }

  .avatar-container .dropdown :global(button) {
    background: none;
    border: none;
    padding: 0;
    margin: 0;
    cursor: pointer;
    appearance: none;
    box-shadow: none;
    outline: none;
    -webkit-appearance: none;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .avatar-container .dropdown :global(button) :global(svg) {
    color: #888;
    transition: color 0.15s ease;
  }

  .avatar-container .dropdown :global(button:hover) :global(svg) {
    color: #f47e3a;
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
