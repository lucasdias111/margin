<script lang="ts">
  import type { User } from '$src/interfaces/User'
  import { onDestroy, onMount } from 'svelte'
  import { webSocketService } from '$src/services/WebSocketService'
  import { chatState } from '$src/states/ChatState.svelte'
  import { userState } from '$src/states/UserState.svelte'
  import UserEntry from '$src/components/sidebar/sidebar_list/UserEntry.svelte'
  import { userService } from '$src/services/UserService'
  import type { WebSocketMessage } from '$src/interfaces/WebSocketMessages'
  import UnreadNotificationBadge from '$src/components/chat/UnreadNotificationBadge.svelte'

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

  let { searchUser = '' }: { searchUser?: string } = $props()
  let filteredUsers = $derived(
    recentUsers.filter((user) =>
      user.username.toLowerCase().includes((searchUser ?? '').toLowerCase())
    )
  )
</script>

<div class="chat_overview">
  <ul>
    {#each recentUsers as user (user.id)}
      <UserEntry {user} />
    {/each}
    {#each Array.from({ length: 10 })}
      <li class="placeholder"></li>
    {/each}
  </ul>
</div>

<style>
  .chat_overview {
    display: flex;
    flex: 1;
    flex-direction: column;
    height: 100%;
    width: 100%;
  }

  .chat_overview ul {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 0;
    margin: 0;
  }

  .chat_overview li {
    flex: 1;
    list-style: none;
    padding: 0;
    margin: 10;
  }

  .chat_overview li:last-child {
    border-bottom: none;
  }

  .placeholder {
    align-items: center;
    justify-content: center;
    flex: 1;
    border-bottom: 1px solid rgb(211, 210, 210);
    color: black;
  }
</style>
