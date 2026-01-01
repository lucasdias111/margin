<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import Sidebar from '$src/components/sidebar/Sidebar.svelte'
  import ContentWindow from '$src/components/content/Content.svelte'
  import Header from '$src/components/header/MainHeader.svelte'
  import type { User } from '$src/interfaces/User'
  import { webSocketService } from '$src/services/WebSocketService'
  import { authenticatedFetch } from '$src/services/api'
  import { userState } from '$src/states/UserState.svelte'

  let content: ContentWindow

  onMount(() => {
    getCurrentUser()
    webSocketService.connect()
  })

  onDestroy(() => {
    webSocketService.disconnect()
  })

  async function getCurrentUser(): Promise<void> {
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
      userState.setUser(user)
      console.log('Current user loaded:', user)
    } catch (error) {
      console.error('Error getting current user:', error)
    }
  }
</script>

<div class="app">
  <Header />
  <div class="content">
    <Sidebar />
    <ContentWindow bind:this={content} />
  </div>
</div>

<style>
  .app {
    height: 97vh;
    display: flex;
    flex-direction: column;
  }

  .content {
    display: flex;
    flex: 1;
    overflow: hidden;
  }
</style>
