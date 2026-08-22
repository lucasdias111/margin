<script lang="ts">
  import type { Message } from '$src/interfaces/Messages'
  import { sessionState } from '$src/states/SessionState.svelte'
  import { conversationsState } from '$src/states/ConversationsState.svelte.ts'
  import { flip } from 'svelte/animate'
  import { DURATION, EASING, popIn, pressable, scaleFade } from '$src/animations'

  interface Props {
    message: Message
    onToggleReaction: (emoji: string) => void
  }

  let { message, onToggleReaction }: Props = $props()

  let grouped = $derived.by(() => {
    const msg = conversationsState.messagesByConversationId
      .get(message.conversationId)
      ?.find((m) => m.id === message.id)

    const reactions = msg?.reactions ?? []

    return Object.entries(
      reactions.reduce<Record<string, { count: number; userIds: number[]; names: string[] }>>(
        (acc, r) => {
          if (!acc[r.emoji]) acc[r.emoji] = { count: 0, userIds: [], names: [] }
          acc[r.emoji].count++
          acc[r.emoji].userIds.push(r.userId)
          acc[r.emoji].names.push(r.displayName)
          return acc
        },
        {}
      )
    )
  })
</script>

{#if grouped.length > 0}
  <div class="reactions">
    {#each grouped as [emoji, data] (emoji)}
      {@const isMine = data.userIds.includes(sessionState.currentUser?.id ?? -1)}
      <button
        class="pill"
        class:mine={isMine}
        title={data.names.join(', ')}
        onclick={() => onToggleReaction(emoji)}
        animate:flip={{ duration: DURATION.base, easing: EASING.standard }}
        in:popIn={{ start: 0.5 }}
        out:scaleFade={{ start: 0.6, duration: 'fast' }}
        use:pressable={{ scale: 0.9 }}
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
      background var(--motion-fast) var(--ease-standard),
      border-color var(--motion-fast) var(--ease-standard),
      box-shadow var(--motion-fast) var(--ease-standard);
    line-height: 1.4;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  }

  .pill:hover {
    background: #f5ece0;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.16);
  }

  .pill.mine {
    background: #fde8d8;
    border-color: #ff843c;
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
