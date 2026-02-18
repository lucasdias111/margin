<script lang="ts">
  import ServerSelection from '$src/components/sidebar/ServerSelection.svelte'
  import Navigation from './Navigation.svelte'
  import UsersList from './sidebar_list/UsersList.svelte'
  import { chatState } from '$src/states/ChatState.svelte'
  import SpacesList from './sidebar_list/SpacesList.svelte'
  import Avatar from './sidebar_list/Avatar.svelte'
  import { userState } from '$src/states/UserState.svelte'
  import SearchBar from '$src/components/content/SearchBar.svelte'

  let selectedContent = $derived(chatState.currentlySelectedContent)
  let currentUser = $derived(userState.currentUser)
  let searchUser = $state('')
</script>

<div class="sidebars">
  <div class="sidebar_left">
    <Navigation />
    <ServerSelection />
  </div>
  <div class="sidebar_right">
    <div class="search_bar">

      {#if currentUser && selectedContent === null}
        <Avatar user={currentUser} />
      {/if}

      <div class="dm-header">
        {#if selectedContent === 'private'}
          <h3 class="dm-head">Private chat</h3>
          <SearchBar />
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
</div>

<style>
  .sidebars {
    display: flex;
    height: 100%;
    padding: 10px;
    box-sizing: border-box;
    gap: 10px;
  }

  .sidebar_left {
    width: 80px;
    display: flex;
    flex-direction: column;
    background-color: #1b1919;
    border-radius: 20px;
    padding: 20px;
    overflow-y: auto;
    box-sizing: border-box;
    flex-shrink: 0;
  }

  .sidebar_right {
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
    color: black;
    font-size: 20px;
    margin: 0;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    text-align: center;
  }
</style>
