<script lang="ts">
  import { chatState } from '$src/states/ChatState.svelte'
  import type { Space } from '$src/interfaces/Space'
  import type { Channel } from '$src/interfaces/Channel'
  import { onDestroy, onMount } from 'svelte'
  import { authenticatedGet } from '$src/services/api'
  import { SvelteMap } from 'svelte/reactivity'

  let spaces = $state<Space[]>([])
  let expandedSpaceId = $state<number | null>(null)
  let channelsBySpace = new SvelteMap<number, Channel[]>()

  onMount(async () => {
    spaces = await getAllSpacesForServer()
  })

  onDestroy(() => {
    chatState.selectChannel(null)
  })

  async function getAllSpacesForServer(): Promise<Space[]> {
    try {
      const response = await authenticatedGet(`spaces/get_all_spaces`)

      if (!response.ok) {
        throw new Error(`Request failed with status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error getting spaces:', error)
      return []
    }
  }

  async function toggleSpace(space: Space): Promise<void> {
    if (expandedSpaceId === space.id) {
      expandedSpaceId = null
      return
    }

    expandedSpaceId = space.id
    chatState.selectSpace(space)

    if (!channelsBySpace.has(space.id)) {
      const response = await authenticatedGet(`api/channels/${space.id}/get_channels_for_space`)
      if (response.ok) {
        const channels: Channel[] = await response.json()
        channelsBySpace.set(space.id, channels)
      }
    }
  }

  function selectChannel(channel: Channel): void {
    chatState.selectChannel(channel)
    console.log('Selected channel:', channel)
  }
</script>

<div class="spaces-container">
  <h3>Channels</h3>
  <ul class="spaces-list">
    {#each spaces as space (space.id)}
      <li class="space-item">
        <button
          class="space-button"
          class:expanded={expandedSpaceId === space.id}
          onclick={() => toggleSpace(space)}
        >
          <span class="arrow">{expandedSpaceId === space.id ? '▼' : '▶'}</span>
          {space.name}
        </button>

        {#if expandedSpaceId === space.id}
          <ul class="channels-list">
            {#if channelsBySpace.get(space.id)}
              {#each channelsBySpace.get(space.id) || [] as channel (channel.id)}
                <li class="channel-item">
                  <button class="channel-button" onclick={() => selectChannel(channel)}>
                    # {channel.name}
                  </button>
                </li>
              {/each}
            {:else}
              <li class="loading">Loading channels...</li>
            {/if}
          </ul>
        {/if}
      </li>
    {/each}
  </ul>
</div>

<style>
  .spaces-container {
    padding: 1rem;
    color: black;
  }

  .spaces-list {
    list-style: none;
    padding: 0;
    margin: 0;
    color: black;
  }

  .space-item {
    margin-bottom: 0.25rem;
    color: black;
  }

  .space-button {
    width: 100%;
    padding: 0.5rem;
    background: transparent;
    color: black;
    border: none;
    cursor: pointer;
    text-align: left;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    border-radius: 4px;
    transition: background-color 0.2s;
  }

  .space-button:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .space-button.expanded {
    font-weight: bold;
    color: black;
  }

  .arrow {
    font-size: 0.75rem;
    transition: transform 0.2s;
    color: black;
  }

  .channels-list {
    list-style: none;
    padding-left: 1.5rem;
    margin: 0.25rem 0 0 0;
    color: black;
  }

  .channel-item {
    margin-bottom: 0.25rem;
    color: black;
  }

  .channel-button {
    width: 100%;
    padding: 0.375rem 0.5rem;
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
    border-radius: 4px;
    transition: background-color 0.2s;
    color: black;
  }

  .channel-button:hover {
    background-color: rgba(255, 255, 255, 0.08);
    color: black;
  }

  .loading {
    padding: 0.375rem 0.5rem;
    color: black;
    font-style: italic;
  }
</style>
