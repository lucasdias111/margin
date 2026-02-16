<script lang="ts">
  import ChannelEntry from '$src/components/sidebar/sidebar_list/ChannelEntry.svelte'
  import type { Space } from '$src/interfaces/Space'
  import { chatState } from '$src/states/ChatState.svelte'
  import { authenticatedGet } from '$src/services/api'
  import type { Channel } from '$src/interfaces/Channel'
  import { SvelteMap } from 'svelte/reactivity'

  interface Props {
    space: Space
  }

  let { space }: Props = $props()

  let expandedSpaceId = $state<number | null>(null)
  let channelsBySpace = new SvelteMap<number, Channel[]>()

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
</script>
<div>
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
            <ChannelEntry {channel} />
          {/each}
        {:else}
          <li class="loading">Loading channels...</li>
        {/if}
      </ul>
    {/if}
  </li>
</div>

<style>
  .space-item {
    margin-bottom: 0.25rem;
  }

  .space-button {
    width: 100%;
    padding: 0.5rem;
    background: transparent;
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
  }

  .arrow {
    font-size: 0.75rem;
    transition: transform 0.2s;
  }

  .channels-list {
    list-style: none;
    padding-left: 1.5rem;
    margin: 0.25rem 0 0 0;
  }

  .loading {
    padding: 0.375rem 0.5rem;
    color: #888;
    font-style: italic;
  }
</style>
