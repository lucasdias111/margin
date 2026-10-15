<script lang="ts">
  import UsersList from './sidebar_list/UsersList.svelte'
  import SpacesList from './sidebar_list/SpacesList.svelte'
  import MeetingsList from './sidebar_list/MeetingsList.svelte'
  import UserSearchBar from '$src/components/common/user/UserSearchBar.svelte'
  import type { User } from '$src/interfaces/User'
  import { View } from '$src/interfaces/View'
  import MarginNavigationItem from '$src/components/content/sidebar/sidebar_list/MarginNavigationItem.svelte'
  import MarginSwitcher from '$src/components/content/sidebar/sidebar_list/MarginSwitcher.svelte'
  import Settings from '$src/components/content/settings/Settings.svelte'
  import Icon from '$src/components/common/icons/Icon.svelte'
  import Button from '$src/components/common/buttons/Button.svelte'
  import NewConversationModal from '$src/components/content/chat/private/NewConversationModal.svelte'
  import NewGroupChatModal from '$src/components/content/chat/group/NewGroupChatModal.svelte'
  import { usersService } from '$src/services/UsersService'
  import { channelService } from '$src/services/ChannelService'
  import { navigationState } from '$src/states/NavigationState.svelte'
  import { navigationService } from '$src/services/NavigationService'
  import { marginState } from '$src/states/MarginState.svelte'
  import { clickOutside } from '$src/actions/clickOutside'
  import { scaleFade, viewIn, viewOut } from '$src/animations'

  let selectedContent = $derived<View>(navigationState.view)
  let newPrivateChatOpen = $state(false)
  let newGroupChatOpen = $state(false)
  let dropdownOpen = $state(false)
  let isHome = $derived(!navigationState.selectedChannel)

  function onSelectUser(user: User): void {
    usersService.select(user)
    navigationService.setView(View.Private)
  }

  function goHome(): void {
    channelService.select(null)
  }

  function openPrivateChat(): void {
    dropdownOpen = false
    newPrivateChatOpen = true
  }

  function openGroupChat(): void {
    dropdownOpen = false
    newGroupChatOpen = true
  }
</script>

<div class="sidebar">
  {#key selectedContent}
    {#if selectedContent === 'private'}
      <div class="pane panel" data-tour="private-sidebar" in:viewIn out:viewOut>
        <div class="panel-header">
          <div class="search-row">
            <UserSearchBar {onSelectUser} showSharedMargins={true} />
            <div class="new-chat-wrapper" use:clickOutside={() => (dropdownOpen = false)}>
              <Button
                buttonType="secondary"
                size="small"
                class="new-chat-btn"
                onClick={() => (dropdownOpen = !dropdownOpen)}
              >
                {#snippet children()}
                  <Icon name="plus" size={14} />
                {/snippet}
              </Button>
              {#if dropdownOpen}
                <div
                  class="dropdown"
                  transition:scaleFade={{ start: 0.9, distance: -6, origin: 'top right' }}
                >
                  <button class="dropdown-item" onclick={openPrivateChat}>
                    <Icon name="messages" size={13} />
                    <span class="item-text">
                      <span class="item-title">Private chat</span>
                      <span class="item-hint">1-on-1, optional Secret Chat</span>
                    </span>
                  </button>
                  <button class="dropdown-item" onclick={openGroupChat}>
                    <Icon name="users" size={13} />
                    <span class="item-text">
                      <span class="item-title">Group chat</span>
                      <span class="item-hint">Multiple people, optional Secret Group</span>
                    </span>
                  </button>
                </div>
              {/if}
            </div>
          </div>
        </div>
        <div class="panel-content">
          <UsersList />
        </div>
      </div>
    {:else if selectedContent === 'margin' && marginState.isMemberOfAnyMargins}
      <div class="pane panel" in:viewIn out:viewOut>
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
    {:else if selectedContent === 'meetings'}
      <div class="pane panel" in:viewIn out:viewOut>
        <div class="panel-content">
          <MeetingsList />
        </div>
      </div>
    {:else if selectedContent === 'settings'}
      <div class="pane panel" in:viewIn out:viewOut>
        <Settings />
      </div>
    {/if}
  {/key}
</div>

<NewConversationModal open={newPrivateChatOpen} onClose={() => (newPrivateChatOpen = false)} />
<NewGroupChatModal open={newGroupChatOpen} onClose={() => (newGroupChatOpen = false)} />

<style>
  .sidebar {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 300px;
    min-height: 0;
    gap: 10px;
  }

  .panel:not(:only-child) {
    position: absolute;
    inset: 0;
  }

  @media (max-width: 768px) {
    .sidebar {
      width: 100%;
      height: 100%;
      gap: 0;
    }

    .panel {
      border-radius: 0;
      border: none;
    }
  }

  .panel {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
  }

  .panel-header {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 16px 10px 8px;
    flex-shrink: 0;
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

  .search-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .new-chat-wrapper {
    position: relative;
    flex-shrink: 0;
  }

  .dropdown {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    background: #fff;
    border: 1.5px solid #ebebeb;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    min-width: 220px;
    z-index: 100;
    overflow: hidden;
  }

  .dropdown-item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 10px 14px;
    border: none;
    background: none;
    cursor: pointer;
    text-align: left;
    font-family: inherit;
    color: #2d2d2d;
    transition: background 0.1s;
  }

  .dropdown-item:hover {
    background: #fff8f5;
  }

  .item-text {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .item-title {
    font-size: 13px;
    font-weight: 600;
    color: #2d2d2d;
  }

  .item-hint {
    font-size: 11px;
    color: #aaa;
  }
</style>
