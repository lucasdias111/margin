<script lang="ts">
  import { userListState } from '$src/states/UserListState.svelte.js'
  import { chatState } from '$src/states/ChatState.svelte.js'
  import UserEntry from '$src/components/content/sidebar/sidebar_list/UserEntry.svelte'

  let { searchUser = '' }: { searchUser?: string } = $props()

  let filteredUsers = $derived(
    userListState.recentUsers.filter((recentUser) =>
      recentUser.user.displayName.toLowerCase().includes((searchUser ?? '').toLowerCase())
    )
  )
</script>

<div class="chat_overview">
  <ul>
    {#each filteredUsers as recentUser (recentUser.user.id)}
      <UserEntry
        {recentUser}
        isOnline={recentUser.user.isOnline}
        isSelected={chatState.selectedUser?.id === recentUser.user.id}
      />
    {/each}
  </ul>
</div>

<style>
  .chat_overview {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    width: 100%;
  }

  .chat_overview ul {
    display: flex;
    flex-direction: column;
    padding: 0 10px 20px;
    margin: 0;
    list-style: none;
    gap: 2px;
  }
</style>
