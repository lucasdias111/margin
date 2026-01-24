<script lang="ts">
  import type { User } from '$src/interfaces/User'
  import { onDestroy, onMount } from 'svelte'
  import { webSocketService } from '$src/services/WebSocketService'
  import { chatState } from '$src/states/ChatState.svelte'
  import { authenticatedGet } from '$src/services/api'
  import type { WebSocketMessage } from '$src/interfaces/WebSocketMessages'

  let users = $state<User[]>([])

  onMount(() => {
    getAllUsersForServer().then((fetchedUsers) => {
      users = fetchedUsers
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
    console.log('User login event:', data)
    if (!users.find((u) => u.id === data.payload.id)) {
      users = [...users, data.payload]
    }
  }

  function handleUserLogout(data: WebSocketMessage<User>): void {
    console.log('User logout event:', data)
    users = users.filter((user) => user.id !== data.payload.id)
  }

  async function getAllUsersForServer(): Promise<User[]> {
    try {
      const response = await authenticatedGet(`users/get_all_users`)

      return await response.json()
    } catch (error) {
      console.error('Error getting users:', error)
      return []
    }
  }

  export async function getCurrentUser(): Promise<User | null> {
    try {
      const response = await authenticatedGet(`users/me`)

      if (!response.ok) {
        throw new Error(`Request failed with status: ${response.status}`)
      }
      const user: User = await response.json()
      return user
    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  }
</script>

<div>
  <h3>Users</h3>
  <ul>
    {#each users as user (user.id)}
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
