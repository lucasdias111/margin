<script lang="ts">
  import type { Message } from '$src/interfaces/Messages'
  import { userState } from '$src/states/UserState.svelte.js'

  interface Props {
    message: Message
    onToggleReaction: (emoji: string) => void
  }

  let { message, onToggleReaction }: Props = $props()

  let grouped = $derived(
    Object.entries(
      (message.reactions ?? []).reduce<
        Record<string, { count: number; userIds: number[]; names: string[] }>
      >((acc, r) => {
        if (!acc[r.emoji]) acc[r.emoji] = { count: 0, userIds: [], names: [] }
        acc[r.emoji].count++
        acc[r.emoji].userIds.push(r.userId)
        acc[r.emoji].names.push(r.displayName)
        return acc
      }, {})
    )
  )
</script>

{#if grouped.length > 0}
  <div class="reactions">
    {#each grouped as [emoji, data] (emoji)}
      {@const isMine = data.userIds.includes(userState.currentUser?.id ?? -1)}
      <button
        class="pill"
        class:mine={isMine}
        title={data.names.join(', ')}
        onclick={() => onToggleReaction(emoji)}
      >
        {emoji} <span class="count">{data.count}</span>
      </button>
    {/each}
  </div>
{/if}

<style>
  .reactions {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: -10px;
    position: relative;
  }

  .pill {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    background: #ffffff;
    border: 1.5px solid #e8d5c0;
    border-radius: 12px;
    padding: 1px 7px;
    font-size: 13px;
    cursor: pointer;
    transition:
      background 0.12s,
      border-color 0.12s;
    line-height: 1.4;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  }

  .pill:hover {
    background: #f5ece0;
  }

  .pill.mine {
    background: #fde8d8;
    border-color: #f47e3a;
  }

  .count {
    font-size: 11px;
    font-weight: 600;
    color: #666;
  }

  .pill.mine .count {
    color: #c05e1a;
  }
</style>
