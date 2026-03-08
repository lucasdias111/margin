<script lang="ts">
  import UsersList from './sidebar_list/UsersList.svelte'
  import SpacesList from './sidebar_list/SpacesList.svelte'
  import UserSearchBar from '$src/components/common/user/UserSearchBar.svelte'
  import { chatState } from '$src/states/ChatState.svelte.js'
  import type { User } from '$src/interfaces/User'
  import type { ContentType } from '$src/interfaces/Content'

  let selectedContent = $derived<ContentType>(chatState.currentlySelectedContent)
  let isHome = $derived(!chatState.selectedChannel)

  function onSelectUser(user: User): void {
    chatState.selectUser(user)
    chatState.selectPrivateChatContent()
  }

  function goHome(): void {
    chatState.selectChannel(null)
  }
</script>

<div class="sidebar">
  {#if selectedContent === 'private'}
    <div class="panel">
      <div class="panel-header">
        <div class="section-heading">
          <span class="header-label">Direct messages</span>
        </div>
        <UserSearchBar {onSelectUser} />
      </div>
      <div class="panel-content">
        <UsersList />
      </div>
    </div>
  {:else if selectedContent === 'margin' && chatState.hasMargin}
    <div class="panel">
      <div class="panel-divider"></div>

      <div class="panel-nav">
        <button class="home-btn" class:active={isHome} onclick={goHome}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          >
            <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
            <polyline points="9 21 9 12 15 12 15 21" />
          </svg>
          Home
        </button>
      </div>

      <div class="panel-divider"></div>

      <div class="panel-content">
        <SpacesList />
      </div>
    </div>
  {/if}
</div>

<style>
  .sidebar {
    display: flex;
    flex-direction: column;
    width: 300px;
    min-height: 0;
    gap: 10px;
  }

  .panel {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    background-color: #fff;
    border-radius: 20px;
  }

  .panel-header {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 16px 10px 8px;
    flex-shrink: 0;
  }

  .section-heading {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 8px;
  }

  .header-label {
    font-size: 14px;
    font-weight: 600;
    color: #aaa;
    letter-spacing: 0.09em;
    text-transform: uppercase;
  }

  .panel-nav {
    padding: 12px 10px 4px;
    flex-shrink: 0;
  }

  .home-btn {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: none;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 550;
    color: #888;
    cursor: pointer;
    text-align: left;
    transition:
      background 0.12s,
      color 0.12s;
  }

  .home-btn:hover:not(.active) {
    background: rgba(0, 0, 0, 0.04);
    color: #2a2a2a;
  }

  .home-btn.active {
    background: rgba(228, 113, 42, 0.1);
    color: #f47e3a;
  }

  .home-btn svg {
    flex-shrink: 0;
    opacity: 0.6;
  }

  .home-btn.active svg {
    opacity: 1;
  }

  .panel-divider {
    height: 1px;
    background: rgba(0, 0, 0, 0.05);
    margin: 0 12px;
    flex-shrink: 0;
  }

  .panel-content {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }

  .panel-content::-webkit-scrollbar {
    width: 4px;
  }

  .panel-content::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.08);
    border-radius: 4px;
  }
</style>
