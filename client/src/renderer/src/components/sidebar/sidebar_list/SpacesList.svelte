<script lang="ts">
  import { chatState } from '$src/states/ChatState.svelte'
  import type { Space } from '$src/interfaces/Space'

  const channels: Space[] = [
    {
      id: '1',
      name: 'General',
      description: 'General discussion',
      memberCount: 150
    },
    {
      id: '2',
      name: 'Random',
      description: 'Random chat',
      memberCount: 89
    },
    {
      id: '3',
      name: 'Tech Talk',
      description: 'Technology discussions',
      memberCount: 203
    },
    {
      id: '4',
      name: 'Announcements',
      description: 'Important updates',
      memberCount: 500
    },
    {
      id: '5',
      name: 'Help',
      description: 'Get help here',
      memberCount: 45
    }
  ]
</script>

<div>
  <h3>Channels</h3>
  <ul>
    {#each channels as channel}
      <li>
        <button onclick={() => chatState.selectSpace(channel)}>
          {channel.name}
        </button>
      </li>
    {/each}
  </ul>
</div>

<style>
</style>
