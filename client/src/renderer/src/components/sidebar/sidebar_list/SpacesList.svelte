<script lang="ts">
  import { chatState } from '$src/states/ChatState.svelte'
  import type { Space } from '$src/interfaces/Space'
  import { onDestroy, onMount } from 'svelte'
  import { authenticatedGet } from '$src/services/api'
  import SpaceEntry from '$src/components/sidebar/sidebar_list/SpaceEntry.svelte'

  let spaces = $state<Space[]>([])

  onMount(async () => {
    spaces = await getAllSpacesForServer()
  })

  onDestroy(() => {
    chatState.selectChannel(null)
  })

  async function getAllSpacesForServer(): Promise<Space[]> {
    const response = await authenticatedGet(`spaces/get_all_spaces`)

    if (!response.ok) {
      throw new Error(`Request failed with status: ${response.status}`)
    }

    return await response.json()
  }
</script>

<div class="spaces-container">
  <h3>Channels</h3>
  <ul class="spaces-list">
    {#each spaces as space (space.id)}
      <SpaceEntry {space} />
    {/each}
  </ul>
</div>

<style>
  .spaces-container {
    padding: 1rem;
  }

  .spaces-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
</style>
