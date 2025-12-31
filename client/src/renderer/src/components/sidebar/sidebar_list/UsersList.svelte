<script lang="ts">
  import type { User } from '$src/interfaces/User'
  import { onMount, onDestroy } from 'svelte'
  import { webSocketService } from '$src/services/WebSocketService'
  import { chatState } from '$src/states/ChatState.svelte'
  import { authenticatedFetch } from '$src/services/api'

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
  })

  function handleUserLogin(data: any) {
    console.log('User login event:', data)
    const newUser: User = JSON.parse(data.userJson)
    if (!users.find((u) => u.id === newUser.id)) {
      users = [...users, newUser]
    }
  }

  function handleUserLogout(data: any) {
    console.log('User logout event:', data)
    const loggedOutUser: User = JSON.parse(data.userJson)
    users = users.filter((user) => user.id !== loggedOutUser.id)
  }

  async function getAllUsersForServer(): Promise<User[]> {
    try {
      const response = await authenticatedFetch(`users/get_all_users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Request failed with status: ${response.status}`)
      }
      const users: User[] = await response.json()
      return users
    } catch (error) {
      console.error('Error getting users:', error)
      return []
    }
  }

  export async function getCurrentUser(): Promise<User | null> {
    try {
      const response = await authenticatedFetch(`users/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

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
    {#each users as user}
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
