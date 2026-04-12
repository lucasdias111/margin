<script lang="ts">
  import UsersList from './sidebar_list/UsersList.svelte'
  import SpacesList from './sidebar_list/SpacesList.svelte'
  import UserSearchBar from '$src/components/common/user/UserSearchBar.svelte'
  import { chatState } from '$src/states/ChatState.svelte.js'
  import type { User } from '$src/interfaces/User'
  import type { ContentType } from '$src/interfaces/Content'
  import MarginNavigationItem from '$src/components/content/sidebar/sidebar_list/MarginNavigationItem.svelte'
  import MarginSwitcher from '$src/components/content/sidebar/sidebar_list/MarginSwitcher.svelte'
  import Settings from '$src/components/content/settings/Settings.svelte'
  import Icon from '$src/components/common/icons/Icon.svelte'

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
        <UserSearchBar {onSelectUser} showSharedMargins={true} />
      </div>
      <div class="panel-content">
        <UsersList />
      </div>
    </div>
  {:else if selectedContent === 'margin' && chatState.hasMargin}
    <div class="panel">
      <div class="panel-divider"></div>

      <div class="panel-nav">
        <MarginNavigationItem label="Home" active={isHome} onclick={goHome} icon={homeIcon} />
        {#snippet homeIcon()}
          <Icon name="home" size={14} />
        {/snippet}
        <MarginSwitcher />
      </div>

      <div class="panel-divider"></div>

      <div class="panel-content">
        <SpacesList />
      </div>
    </div>
  {:else if selectedContent === 'settings'}
    <div class="panel">
      <Settings />
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
    color: #e8712a;
    letter-spacing: 0.09em;
    text-transform: uppercase;
  }

  .panel-nav {
    padding: 12px 10px 4px;
    flex-shrink: 0;
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
