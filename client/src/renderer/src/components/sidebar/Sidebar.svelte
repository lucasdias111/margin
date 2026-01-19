<script lang="ts">
  import ServerSelection from '$src/components/sidebar/ServerSelection.svelte'
  import Navigation from './Navigation.svelte'
  import UsersList from './sidebar_list/UsersList.svelte'
  import { chatState } from '$src/states/ChatState.svelte'
  import SpacesList from './sidebar_list/SpacesList.svelte'
  import Logout from './Logout.svelte'

  let selectedContent = $derived(chatState.currentlySelectedContent)
</script>

<div class="sidebar">
  <ServerSelection />
  <Navigation />
  {#if selectedContent === 'private'}
    <UsersList />
  {:else if selectedContent === 'space'}
    <SpacesList />
  {/if}
  <Logout />
</div>

<style>
  .sidebar {
    width: 250px;
    background-color: #2a2a2a;
    border-right: 1px solid #333;
    padding: 20px;
    overflow-y: auto;
  }
</style>
