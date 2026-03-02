<script lang="ts">
  import { userListState } from '$src/states/UserListState.svelte'
  import { presenceState } from '$src/states/PresenceState.svelte'
  import { chatState } from '$src/states/ChatState.svelte'
  import UserEntry from '$src/components/sidebar/sidebar_list/UserEntry.svelte'

  let { searchUser = '' }: { searchUser?: string } = $props()

  let filteredUsers = $derived(
    userListState.recentUsers.filter((recentUser) =>
      recentUser.user.username.toLowerCase().includes((searchUser ?? '').toLowerCase())
    )
  )
</script>

<div class="chat_overview">
  <ul>
    {#each filteredUsers as recentUser (recentUser.user.id)}
      <UserEntry
        {recentUser}
        isOnline={presenceState.isOnline(recentUser.user.id)}
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
    padding: 0;
    margin: 0;
    list-style: none;
  }
</style>
