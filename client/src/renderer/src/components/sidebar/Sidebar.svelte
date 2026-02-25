<script lang="ts">
  import UsersList from './sidebar_list/UsersList.svelte'
  import SpacesList from './sidebar_list/SpacesList.svelte'
  import UserSearchBar from '$src/components/content/UserSearchBar.svelte'
  import marginLogo from '$src/assets/pics/margin-lo.png'
  import { chatState } from '$src/states/ChatState.svelte'
  import type { User } from '$src/interfaces/User'
  import type { ContentType } from '$src/interfaces/Content'
  import { marginService } from '$src/interfaces/MarginsService'

  let selectedContent = $derived<ContentType>(chatState.currentlySelectedContent)

  function onSelectUser(user: User): void {
    chatState.selectUser(user)
    chatState.selectPrivateChatContent()
  }

  function onManageSpaces(): void {
    chatState.currentlySelectedContent = 'manage'
  }

  $effect(() => {
    if (selectedContent === 'margin') {
      marginService.getMargins().then((margins) => {
        chatState.selectMargin(margins[0])
      })
    }
  })
</script>

<div class="sidebar">
  <div class="sidebar-header">
    {#if selectedContent === 'private'}
      <h3 class="sidebar-title">Private chat</h3>
      <UserSearchBar {onSelectUser} />
    {:else if selectedContent === 'margin'}
      <img src={marginLogo} alt="Margin logo" />
      <button class="manage-button" onclick={onManageSpaces}>Manage spaces</button>
    {/if}
  </div>

  <div class="sidebar-content">
    {#if selectedContent === 'private'}
      <UsersList />
    {:else if selectedContent === 'margin'}
      <SpacesList />
    {/if}
  </div>
</div>

<style>
  .sidebar {
    display: flex;
    flex-direction: column;
    width: 300px;
    min-height: 0;
    gap: 10px;
  }

  .sidebar-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 20px;
    flex-shrink: 0;
    background-color: #fff;
    border-radius: 20px;
    text-align: center;
  }

  .sidebar-content {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    background-color: #fff;
    border-radius: 20px;
    overflow-y: auto;
  }

  .sidebar-title {
    margin: 0;
    font-size: 20px;
    color: #2d2d2d;
  }

  .manage-button {
    padding: 8px 12px;
    margin-top: 10px;
    background-color: #da6b10;
    border: none;
    border-radius: 10px;
    color: #fff;
    font-size: 1.5vh;
    cursor: pointer;
  }

  .manage-button:hover {
    background-color: #e19a5d;
  }
</style>
