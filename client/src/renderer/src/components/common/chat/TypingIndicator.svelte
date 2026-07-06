<script lang="ts">
  import type { TypingUser } from '$src/states/TypingIndicatorState.svelte'

  let { users }: { users: TypingUser[] } = $props()

  const label = $derived.by(() => {
    if (users.length === 0) return ''
    if (users.length === 1) return `${users[0].displayName} is typing`
    if (users.length === 2) return `${users[0].displayName} and ${users[1].displayName} are typing`
    const remaining = users.length - 2
    return `${users[0].displayName}, ${users[1].displayName} and ${remaining} other${remaining === 1 ? '' : 's'} are typing`
  })
</script>

{#if users.length > 0}
  <div class="typing-indicator" role="status" aria-live="polite">
    <span class="dots">
      <span></span><span></span><span></span>
    </span>
    <span class="label">{label}…</span>
  </div>
{/if}

<style>
  .typing-indicator {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 18px 4px;
    font-size: 12px;
    color: #999;
    flex-shrink: 0;
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;
  }

  .label {
    min-width: 0;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dots {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    flex-shrink: 0;
  }

  .dots span {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background-color: #ff843c;
    animation: typing-bounce 1.2s infinite ease-in-out;
  }

  .dots span:nth-child(2) {
    animation-delay: 0.2s;
  }

  .dots span:nth-child(3) {
    animation-delay: 0.4s;
  }

  @keyframes typing-bounce {
    0%,
    60%,
    100% {
      transform: translateY(0);
      opacity: 0.5;
    }
    30% {
      transform: translateY(-3px);
      opacity: 1;
    }
  }
</style>
