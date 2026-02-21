<script lang="ts">
  import { chatState } from '$src/states/ChatState.svelte'
  import type { Space } from '$src/interfaces/Space'
  import type { Channel } from '$src/interfaces/Channel'
  import { onDestroy, onMount } from 'svelte'
  import { spacesService } from '$src/services/SpacesService'

  let spaces = $state<Space[]>([])
  let expandedSpaceId = $state<number | null>(null)

  onMount(async () => {
    spaces = await spacesService.getAllSpacesForServer()
  })

  onDestroy(() => {
    chatState.selectChannel(null)
  })

  async function toggleSpace(space: Space): Promise<void> {
    expandedSpaceId = expandedSpaceId === space.spaceId ? null : space.spaceId
    chatState.selectSpace(space)
  }

  function selectChannel(channel: Channel): void {
    chatState.selectChannel(channel)
  }
</script>

<div class="spaces-container">
  <h3>Spaces</h3>
  <ul class="spaces-list">
    {#each spaces as space (space.spaceId)}
      <li class="space-item">
        <button
          class="space-button"
          class:expanded={expandedSpaceId === space.spaceId}
          onclick={() => toggleSpace(space)}
        >
          <span class="arrow">{expandedSpaceId === space.spaceId ? '▼' : '▶'}</span>
          {space.spaceName}
        </button>

        {#if expandedSpaceId === space.spaceId}
          <ul class="channels-list">
            {#each space.channels as channel (channel.id)}
              <li class="channel-item">
                <button class="channel-button" onclick={() => selectChannel(channel)}>
                  # {channel.name}
                </button>
              </li>
            {/each}
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
    background-color: #c1c1c1;
    color: black;
  }

  .loading {
    padding: 0.375rem 0.5rem;
    color: black;
    font-style: italic;
  }
</style>
