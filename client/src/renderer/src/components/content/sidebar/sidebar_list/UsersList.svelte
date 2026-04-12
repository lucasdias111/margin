<script lang="ts">
  import { userListState } from '$src/states/UserListState.svelte.js'
  import { chatState } from '$src/states/ChatState.svelte.js'
  import UserEntry from '$src/components/content/sidebar/sidebar_list/UserEntry.svelte'
  import Icon from '$src/components/common/icons/Icon.svelte'

  let { searchUser = '' }: { searchUser?: string } = $props()

  let filteredUsers = $derived(
    userListState.recentUsers.filter((recentUser) =>
      recentUser.user.displayName.toLowerCase().includes((searchUser ?? '').toLowerCase())
    )
  )
</script>

<div class="chat_overview">
  {#if filteredUsers.length > 0}
    <ul>
      {#each filteredUsers as recentUser (recentUser.user.id)}
        <UserEntry
          {recentUser}
          isOnline={recentUser.user.isOnline}
          isSelected={chatState.selectedUser?.id === recentUser.user.id}
        />
      {/each}
    </ul>
  {:else}
    <div class="empty-state">
      <Icon name="users" />
      <p class="empty-state-text">
        {searchUser ? 'No users match your search' : 'No recent conversations yet'}
      </p>
    </div>
  {/if}
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

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding-top: 48px;
    gap: 12px;
  }

  .empty-state-icon {
    width: 32px;
    height: 32px;
    color: #b0b0b0;
  }

  .empty-state-text {
    color: #888;
    font-size: 13px;
    font-family: inherit;
    margin: 0;
  }
</style>
