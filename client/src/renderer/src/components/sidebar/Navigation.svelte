<script lang="ts">
  import { chatState } from '$src/states/ChatState.svelte'
  import type { ChatViewType } from '$src/interfaces/Content'
  import UnreadNotificationBadge from '$src/components/chat/UnreadNotificationBadge.svelte'
  import { notificationState } from '$src/states/NotificationState.svelte'
  import { userState } from '$src/states/UserState.svelte'
  import UserAvatar from '$src/components/user/UserAvatar.svelte'

  function onContentSelected(selectedContent: ChatViewType): void {
    chatState.selectContent(selectedContent)
  }
</script>

<div class="button-group">
  {#if userState.currentUser}
    <UserAvatar
      profilePictureUrl={userState.currentUser.profilePictureUrl}
      width={32}
      height={32}
    />
  {/if}
  <button
    onclick={() => onContentSelected('private')}
    class:selected={chatState.currentlySelectedContent === 'private'}
    aria-label="Private conversations"
    title="Private conversations"
  >
    <svg
      fill="#ffffff"
      class="icon dmicon"
      height="64px"
      width="70px"
      viewBox="-16.92 -16.92 69.84 69.84"
      transform="matrix(-1, 0, 0, 1, 0, 0)rotate(0)"
    >
      <path
        d="M18,2.5c-8.82,0-16,6.28-16,14s7.18,14,16,14a18,18,0,0,0,4.88-.68l5.53,3.52a1,1,0,0,0,1.54-.84l0-6.73a13,13,0,0,0,4-9.27C34,8.78,26.82,2.5,18,2.5ZM28.29,24.61a1,1,0,0,0-.32.73l0,5.34-4.38-2.79a1,1,0,0,0-.83-.11A16,16,0,0,1,18,28.5c-7.72,0-14-5.38-14-12s6.28-12,14-12,14,5.38,14,12A11.08,11.08,0,0,1,28.29,24.61Z"
        fill="currentColor"
      />
      <path d="M25,15.5H11a1,1,0,0,0,0,2H25a1,1,0,0,0,0-2Z" fill="currentColor" />
      <path d="M21.75,20.5h-7.5a1,1,0,0,0,0,2h7.5a1,1,0,0,0,0-2Z" fill="currentColor" />
      <path d="M11.28,12.5H24.72a1,1,0,0,0,0-2H11.28a1,1,0,0,0,0,2Z" fill="currentColor" />
    </svg>
    <UnreadNotificationBadge shouldShow={notificationState.getTotalUnreadDirectMessages() > 0} />
  </button>
  <button
    onclick={() => onContentSelected('space')}
    class:selected={chatState.currentlySelectedContent === 'space'}
    aria-label="Spaces"
    title="Spaces"
  >
    <svg
      class="icon spaceicon"
      width="40px"
      height="64px"
      viewBox="-4.68 -4.68 45.36 45.36"
      stroke="currentColor"
    >
      <path
        d="M17.9,17.3c2.7,0,4.8-2.2,4.8-4.9c0-2.7-2.2-4.8-4.9-4.8c-2.7,0-4.8,2.2-4.8,4.8C13,15.1,15.2,17.3,17.9,17.3z M17.8,9.6C17.9,9.6,17.9,9.6,17.8,9.6c1.6,0,2.9,1.3,2.9,2.9s-1.3,2.8-2.9,2.8c-1.6,0-2.8-1.3-2.8-2.8C15,10.9,16.3,9.6,17.8,9.6z"
        fill="currentColor"
      />
      <path
        d="M32.7,16.7c-1.9-1.7-4.4-2.6-7-2.5c-0.3,0-0.5,0-0.8,0c-0.2,0.8-0.5,1.5-0.9,2.1c0.6-0.1,1.1-0.1,1.7-0.1c1.9-0.1,3.8,0.5,5.3,1.6V25h2v-8L32.7,16.7z"
        fill="currentColor"
      />
      <path
        d="M23.4,7.8c0.5-1.2,1.9-1.8,3.2-1.3c1.2,0.5,1.8,1.9,1.3,3.2c-0.4,0.9-1.3,1.5-2.2,1.5c-0.2,0-0.5,0-0.7-0.1c0.1,0.5,0.1,1,0.1,1.4c0,0.2,0,0.4,0,0.6c0.2,0,0.4,0.1,0.6,0.1c2.5,0,4.5-2,4.5-4.4c0-2.5-2-4.5-4.4-4.5c-1.6,0-3,0.8-3.8,2.2C22.5,6.8,23,7.2,23.4,7.8z"
        fill="currentColor"
      />
      <path
        d="M12,16.4c-0.4-0.6-0.7-1.3-0.9-2.1c-0.3,0-0.5,0-0.8,0c-2.6-0.1-5.1,0.8-7,2.4L3,17v8h2v-7.2c1.6-1.1,3.4-1.7,5.3-1.6C10.9,16.2,11.5,16.3,12,16.4z"
        fill="currentColor"
      />
      <path
        d="M10.3,13.1c0.2,0,0.4,0,0.6-0.1c0-0.2,0-0.4,0-0.6c0-0.5,0-1,0.1-1.4c-0.2,0.1-0.5,0.1-0.7,0.1c-1.3,0-2.4-1.1-2.4-2.4c0-1.3,1.1-2.4,2.4-2.4c1,0,1.9,0.6,2.3,1.5c0.4-0.5,1-1,1.5-1.4c-1.3-2.1-4-2.8-6.1-1.5c-2.1,1.3-2.8,4-1.5,6.1C7.3,12.3,8.7,13.1,10.3,13.1z"
        fill="currentColor"
      />
      <path
        d="M26.1,22.7l-0.2-0.3c-2-2.2-4.8-3.5-7.8-3.4c-3-0.1-5.9,1.2-7.9,3.4L10,22.7v7.6c0,0.9,0.7,1.7,1.7,1.7c0,0,0,0,0,0h12.8c0.9,0,1.7-0.8,1.7-1.7c0,0,0,0,0,0V22.7z M24.1,30H12v-6.6c1.6-1.6,3.8-2.4,6.1-2.4c2.2-0.1,4.4,0.8,6,2.4V30z"
        fill="currentColor"
      />
    </svg>
    <UnreadNotificationBadge shouldShow={notificationState.getTotalUnreadChannelMessages() > 0} />
  </button>
  <button
    onclick={() => onContentSelected('explore')}
    class:selected={chatState.currentlySelectedContent === 'explore'}
    aria-label="Explore"
    title="Explore"
  >
    <svg width="30px" height="64px" viewBox="0 0 1024 1024" class="icon exploreicon" fill="#ffffff">
      <path
        d="M511.8 1023.7C229.6 1023.7 0 794.1 0 511.8S229.6 0 511.8 0s511.8 229.6 511.8 511.8-229.5 511.9-511.8 511.9z m0-938.4c-235.2 0-426.5 191.3-426.5 426.5s191.3 426.5 426.5 426.5S938.3 747 938.3 511.8 747 85.3 511.8 85.3z"
        fill="currentColor"
      />
      <path
        d="M292.7 773.7c-11.1 0-22-4.4-30.2-12.5-11.8-11.7-15.6-29.3-9.9-44.9l96.9-263.5c17.9-48.7 54.6-85.4 103.3-103.3l263.5-96.9c15.6-5.7 33.1-1.9 44.9 9.9 11.8 11.7 15.6 29.3 9.9 44.9l-96.9 263.5c-17.9 48.7-54.6 85.4-103.3 103.3l-263.5 96.9c-4.8 1.8-9.8 2.6-14.7 2.6z m366.5-409.2l-176.8 65c-25.6 9.4-43.3 27.2-52.7 52.7L364.6 659l176.8-65c25.6-9.4 43.3-27.2 52.7-52.7l65.1-176.8zM556.1 634.1h0.2-0.2z"
        fill="currentColor"
      />
    </svg>
  </button>

  <button
    onclick={() => onContentSelected('settings')}
    aria-label="Settings"
    title="Settings"
    class="setbut"
  >
    <svg width="64px" height="64px" class="icon seticon" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5" />
      <path
        d="M13.7654 2.15224C13.3978 2 12.9319 2 12 2C11.0681 2 10.6022 2 10.2346 2.15224C9.74457 2.35523 9.35522 2.74458 9.15223 3.23463C9.05957 3.45834 9.0233 3.7185 9.00911 4.09799C8.98826 4.65568 8.70226 5.17189 8.21894 5.45093C7.73564 5.72996 7.14559 5.71954 6.65219 5.45876C6.31645 5.2813 6.07301 5.18262 5.83294 5.15102C5.30704 5.08178 4.77518 5.22429 4.35436 5.5472C4.03874 5.78938 3.80577 6.1929 3.33983 6.99993C2.87389 7.80697 2.64092 8.21048 2.58899 8.60491C2.51976 9.1308 2.66227 9.66266 2.98518 10.0835C3.13256 10.2756 3.3397 10.437 3.66119 10.639C4.1338 10.936 4.43789 11.4419 4.43786 12C4.43783 12.5581 4.13375 13.0639 3.66118 13.3608C3.33965 13.5629 3.13248 13.7244 2.98508 13.9165C2.66217 14.3373 2.51966 14.8691 2.5889 15.395C2.64082 15.7894 2.87379 16.193 3.33973 17C3.80568 17.807 4.03865 18.2106 4.35426 18.4527C4.77508 18.7756 5.30694 18.9181 5.83284 18.8489C6.07289 18.8173 6.31632 18.7186 6.65204 18.5412C7.14547 18.2804 7.73556 18.27 8.2189 18.549C8.70224 18.8281 8.98826 19.3443 9.00911 19.9021C9.02331 20.2815 9.05957 20.5417 9.15223 20.7654C9.35522 21.2554 9.74457 21.6448 10.2346 21.8478C10.6022 22 11.0681 22 12 22C12.9319 22 13.3978 22 13.7654 21.8478C14.2554 21.6448 14.6448 21.2554 14.8477 20.7654C14.9404 20.5417 14.9767 20.2815 14.9909 19.902C15.0117 19.3443 15.2977 18.8281 15.781 18.549C16.2643 18.2699 16.8544 18.2804 17.3479 18.5412C17.6836 18.7186 17.927 18.8172 18.167 18.8488C18.6929 18.9181 19.2248 18.7756 19.6456 18.4527C19.9612 18.2105 20.1942 17.807 20.6601 16.9999C21.1261 16.1929 21.3591 15.7894 21.411 15.395C21.4802 14.8691 21.3377 14.3372 21.0148 13.9164C20.8674 13.7243 20.6602 13.5628 20.3387 13.3608C19.8662 13.0639 19.5621 12.558 19.5621 11.9999C19.5621 11.4418 19.8662 10.9361 20.3387 10.6392C20.6603 10.4371 20.8675 10.2757 21.0149 10.0835C21.3378 9.66273 21.4803 9.13087 21.4111 8.60497C21.3592 8.21055 21.1262 7.80703 20.6602 7C20.1943 6.19297 19.9613 5.78945 19.6457 5.54727C19.2249 5.22436 18.693 5.08185 18.1671 5.15109C17.9271 5.18269 17.6837 5.28136 17.3479 5.4588C16.8545 5.71959 16.2644 5.73002 15.7811 5.45096C15.2977 5.17191 15.0117 4.65566 14.9909 4.09794C14.9767 3.71848 14.9404 3.45833 14.8477 3.23463C14.6448 2.74458 14.2554 2.35523 13.7654 2.15224Z"
        stroke="currentColor"
        stroke-width="1.2"
      />
    </svg>
  </button>
</div>
<style>
  .button-group {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 0.75rem;
  }

  .setbut {
    position: fixed;
    bottom: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .setbut svg {
    width: 30px;
    height: 30px;
  }

  .icon {
    color: #ffffff;
    transition: color 0.2s ease;
  }

  button:hover .icon {
    color: #da6b10;
  }

  button.selected .icon {
    color: #da6b10;
  }

  .button-group button {
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
