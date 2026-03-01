<script lang="ts">
  import type { User } from '$src/interfaces/User'
  import { onDestroy, onMount } from 'svelte'
  import { webSocketService } from '$src/services/WebSocketService'
  import { userState } from '$src/states/UserState.svelte'
  import UserEntry from '$src/components/sidebar/sidebar_list/UserEntry.svelte'
  import { userService } from '$src/services/UserService'
  import type { WebSocketMessage } from '$src/interfaces/WebSocketMessages'
  import type { RecentChatUsers } from '$src/interfaces/RecentChatUsers'
  import { chatState } from '$src/states/ChatState.svelte'

  let recentUsers = $state<RecentChatUsers[]>([])
  let currentUserId = $derived(userState.currentUser?.id)

  $effect(() => {
    if (!currentUserId) return
    userService.getRecentChatUsers(currentUserId).then((fetchedUsers) => {
      recentUsers = fetchedUsers
    })
  })

  onMount(() => {
    webSocketService.on('USER_LOGIN', handleUserLogin)
    webSocketService.on('USER_LOGOUT', handleUserLogout)
  })

  onDestroy(() => {
    webSocketService.off('USER_LOGIN', handleUserLogin)
    webSocketService.off('USER_LOGOUT', handleUserLogout)
    chatState.selectUser(null)
  })

  function handleUserLogin(data: WebSocketMessage<User>): void {
    recentUsers = recentUsers.map((recentUser) =>
      recentUser.user.id === data.payload.id
        ? { ...recentUser, user: { ...recentUser.user, isOnline: true } }
        : recentUser
    )
  }

  function handleUserLogout(data: WebSocketMessage<User>): void {
    recentUsers = recentUsers.map((recentUser) =>
      recentUser.user.id === data.payload.id
        ? { ...recentUser, user: { ...recentUser.user, isOnline: false } }
        : recentUser
    )
  }

  let { searchUser = '' }: { searchUser?: string } = $props()
  let filteredUsers = $derived(
    recentUsers.filter((recentUser) =>
      recentUser.user.username.toLowerCase().includes((searchUser ?? '').toLowerCase())
    )
  )
</script>

<div class="chat_overview">
  <ul>
    {#each filteredUsers as recentUser (recentUser.user.id)}
      <UserEntry {recentUser} isSelected={chatState.selectedUser?.id === recentUser.user.id} />
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
