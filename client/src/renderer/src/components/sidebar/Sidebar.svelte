<script lang="ts">
  import ServerSelection from '$src/components/sidebar/ServerSelection.svelte'
  import Navigation from './Navigation.svelte'
  import UsersList from './sidebar_list/UsersList.svelte'
  import { chatState } from '$src/states/ChatState.svelte'
  import SpacesList from './sidebar_list/SpacesList.svelte'
  import Avatar from './sidebar_list/Avatar.svelte'
  import Logout from './Logout.svelte'
  import { userState } from '$src/states/UserState.svelte'

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
      <Avatar user={currentUser}/>
      {/if}
      
      <div class="dm-header">
        {#if selectedContent === 'private'}
          <h3 class="dmhead">Private chat</h3>
          <div class="search_row">
            <input
              class="searchuser"
              type="text"
              placeholder="Search user..."
              bind:value={searchUser}
            />
            <button class="dmplusbut"> + </button>
          </div>
          <!-- {:else if selectedContent === 'space'}
    <SpacesNav /> -->
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
  .dm-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 0;
    justify-content: space-between;
    text-align: center;
    padding: 20px;
  }

  .dmhead {
    color: black;
    font-size: 20px;
    margin: 0;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    text-align: center;
  }

  .search_row {
    display: flex;
    justify-content: space-between;
    align-items: left;
    gap: 12px;
    margin-top: 10px;
  }

  .searchuser {
    flex: 1;
    width: 160px;
    padding: 10px 16px;
    border-radius: 999px;
    border: 2px solid rgb(207, 207, 207);
    outline: none;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  }

  .dmplusbut {
    background-color: #da6b10;
    border-radius: 40%;
    border: none;
    color: white;
    cursor: pointer;
  }

  .sidebars {
    display: flex;
  }

  .sidebar_left {
    width: 80px;
    height: 88.5vh;
    margin: 10px;
    background-color: #1b1919;
    border-right: 1px solid #333;
    padding: 20px;
    overflow-y: auto;
    border-radius: 20px;
  }

  .sidebar_content {
    display: flex;
    flex: 1;
    flex-direction: column;
    width: 300px;
    margin-top: 10px;
    height: 78vh;
    background-color: white;
    border-radius: 20px;
  }

  .search_bar {
    background-color: white;
    gap: 10px;
    width: 300px;
    height: 115px;
    border-radius: 20px;
    margin-top: 13px;
  }
</style>
