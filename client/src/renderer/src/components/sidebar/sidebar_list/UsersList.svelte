<script lang="ts">
  import type { User } from '$src/interfaces/User'
  import { onDestroy, onMount } from 'svelte'
  import { webSocketService } from '$src/services/WebSocketService'
  import { chatState } from '$src/states/ChatState.svelte'
  import { userState } from '$src/states/UserState.svelte'
  import UserEntry from '$src/components/sidebar/sidebar_list/UserEntry.svelte'
  import { userService } from '$src/services/UserService'
  import type { WebSocketMessage } from '$src/interfaces/WebSocketMessages'

  let recentUsers = $state<User[]>([])
  let onlineUsers = $state<User[]>([])

  onMount(() => {
    userService.getRecentChatUsers(userState.currentUser.id).then((fetchedUsers) => {
      recentUsers = fetchedUsers
    })
    userService.getAllUsersForServer().then((fetchedUsers) => {
      onlineUsers = fetchedUsers
    })
    webSocketService.on('USER_LOGIN', handleUserLogin)
    webSocketService.on('USER_LOGOUT', handleUserLogout)
  })

  onDestroy(() => {
    webSocketService.off('USER_LOGIN', handleUserLogin)
    webSocketService.off('USER_LOGOUT', handleUserLogout)

    chatState.selectUser(null)
  })

  function handleUserLogin(data: WebSocketMessage<User>): void {
    if (!onlineUsers.find((u) => u.id === data.payload.id)) {
      onlineUsers = [...onlineUsers, data.payload]
    }
  }

  function handleUserLogout(data: WebSocketMessage<User>): void {
    onlineUsers = onlineUsers.filter((user) => user.id !== data.payload.id)
  }
</script>

<div>
  <h3>Recent:</h3>
  <ul>
    {#each recentUsers as user (user.id)}
      <UserEntry {user} />
    {/each}
  </ul>
</div>

<style>
</style>
