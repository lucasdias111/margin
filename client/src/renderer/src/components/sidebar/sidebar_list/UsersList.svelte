<script lang="ts">
  import type { User } from '$src/interfaces/User'
  import { onDestroy, onMount } from 'svelte'
  import { webSocketService } from '$src/services/WebSocketService'
  import { chatState } from '$src/states/ChatState.svelte'
  import { authenticatedGet } from '$src/services/api'
  import type { WebSocketMessage } from '$src/interfaces/WebSocketMessages'
  import { userState } from '$src/states/UserState.svelte'
  import UnreadNotificationBadge from '$src/components/chat/UnreadNotificationBadge.svelte'

  let recentUsers = $state<User[]>([])
  let onlineUsers = $state<User[]>([])

  onMount(() => {
    getRecentChatUsers(userState.currentUser.id).then((fetchedUsers) => {
      recentUsers = fetchedUsers
    })
    getAllUsersForServer().then((fetchedUsers) => {
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

  async function getRecentChatUsers(userId: number): Promise<User[]> {
    const response = await authenticatedGet(`users/${userId}/recent_chat_users`)

    if (!response.ok) {
      return []
    }

    return await response.json()
  }

  async function getAllUsersForServer(): Promise<User[]> {
    const response = await authenticatedGet(`users/get_all_users`)

    if (!response.ok) {
      return []
    }

    return await response.json()
  }
</script>

<div>
  <h3>Recent:</h3>
  <ul>
    {#each recentUsers as user (user.id)}
      <li>
        <button onclick={() => chatState.selectUser(user)}>
          {user.username}
          <UnreadNotificationBadge userId={user.id} />
        </button>
      </li>
    {/each}
  </ul>
  <h3>Online users:</h3>
  <ul>
    {#each onlineUsers as user (user.id)}
      <li>
        <button onclick={() => chatState.selectUser(user)}>
          {user.username}
        </button>
      </li>
    {/each}
  </ul>
</div>

<style>
</style>
