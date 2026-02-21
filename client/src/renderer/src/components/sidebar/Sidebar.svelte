<script lang="ts">
  import UsersList from './sidebar_list/UsersList.svelte'
  import { chatState } from '$src/states/ChatState.svelte'
  import SpacesList from './sidebar_list/SpacesList.svelte'
  import Avatar from './sidebar_list/Avatar.svelte'
  import { userState } from '$src/states/UserState.svelte'
  import SearchBar from '$src/components/content/SearchBar.svelte'

  let selectedContent = $derived(chatState.currentlySelectedContent)
  let currentUser = $derived(userState.currentUser)
  let searchUser = $state('')

  function goToManage(): void {
    chatState.currentlySelectedContent = 'manage'
  }
</script>

<div class="sidebar">
  <div class="search_bar">
    {#if currentUser && selectedContent === null}
      <Avatar user={currentUser} />
    {/if}

    <div class="dm-header">
      {#if selectedContent === 'private'}
        <h3 class="dm-head">Private chat</h3>
        <SearchBar />
      {:else if selectedContent === 'space'}
        <div>
          <h3 class="dm-head">Margin</h3>
          <button class="manage-button" onclick={goToManage}>Manage</button>
        </div>
      {/if}
    </div>
  </div>
  <div class="sidebar_content">
    {#if selectedContent === 'private'}
      <UsersList {searchUser} />
    {:else if selectedContent === 'space'}
      <SpacesList />
    {/if}
  </div>
</div>

<style>
  .sidebar {
    display: flex;
    flex-direction: column;
    min-height: 0;
    gap: 10px;
  }

  .search_bar {
    background-color: white;
    width: 300px;
    border-radius: 20px;
    flex-shrink: 0;
  }

  .sidebar_content {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    width: 300px;
    background-color: #ffffff;
    border-radius: 20px;
    overflow-y: auto;
  }

  .dm-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 0;
    justify-content: space-between;
    text-align: center;
    padding: 20px;
  }

  .dm-head {
    color: #2d2d2d;
    font-size: 20px;
    margin: 0;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    text-align: center;
  }

  .manage-button {
    background-color: #da6b10;
    border-radius: 10px;
    font-size: 3vh;
    border: none;
    color: white;
    cursor: pointer;
    padding: 8px 12px;
    margin-top: 10px;
  }

  .manage-button:hover {
    background-color: #e19a5d;
  }
</style>
