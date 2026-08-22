<script lang="ts">
  import type { Message } from '$src/interfaces/Messages'
  import { messageSenderService } from '$src/services/MessageSenderService'
  import Icon from '$src/components/common/icons/Icon.svelte'
  import { pressable, scaleFade } from '$src/animations'

  const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢']

  interface Props {
    message: Message
    isSent: boolean
    currentUserId: number | undefined
    onStartEdit: () => void
    onToggleReaction: (emoji: string) => void
  }

  let { message, isSent, currentUserId, onStartEdit, onToggleReaction }: Props = $props()

  let showMenu = $state(false)
  let showEmojiPicker = $state(false)
</script>

<div class="wrapper">
  <button
    class="btn emoji-btn"
    title="React"
    use:pressable={{ scale: 0.85 }}
    onclick={() => {
      showEmojiPicker = !showEmojiPicker
      showMenu = false
    }}
  >
    <Icon name="smile" size={15} />
  </button>

  {#if isSent}
    <button class="btn" onclick={() => (showMenu = !showMenu)} use:pressable={{ scale: 0.85 }}>
      ⋮
    </button>
  {/if}

  {#if showEmojiPicker}
    <div class="emoji-picker" transition:scaleFade={{ start: 0.85, origin: 'bottom center' }}>
      {#each QUICK_EMOJIS as emoji (emoji)}
        {@const reacted = (message.reactions ?? []).some(
          (r) => r.emoji === emoji && r.userId === currentUserId
        )}
        <button class="emoji-option" class:reacted onclick={() => onToggleReaction(emoji)}>
          {emoji}
        </button>
      {/each}
    </div>
  {/if}

  {#if showMenu}
    <div class="menu" transition:scaleFade={{ start: 0.88, origin: 'center right' }}>
      <button
        class="menu-item edit"
        onclick={() => {
          onStartEdit()
          showMenu = false
        }}
      >
        <Icon name="edit" size={14} />
        Edit
      </button>
      <button class="menu-item delete" onclick={() => messageSenderService.deleteMessage(message)}>
        <Icon name="trash" size={14} />
        Delete
      </button>
    </div>
  {/if}
</div>

<style>
  .wrapper {
    position: relative;
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 16px;
    color: #bbb;
    padding: 4px 6px;
    line-height: 1;
    border-radius: 7px;
    transition:
      background var(--motion-fast) var(--ease-standard),
      color var(--motion-fast) var(--ease-standard);
  }

  .btn:hover {
    background: rgba(0, 0, 0, 0.05);
    color: #888;
  }

  .emoji-picker {
    position: absolute;
    bottom: calc(100% + 6px);
    left: 50%;
    /* Centring lives on `translate` so `transform` stays free for transitions. */
    translate: -50% 0;
    display: flex;
    gap: 2px;
    background: white;
    border: 2px solid #ebebeb;
    border-radius: 24px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    z-index: 20;
    padding: 4px 6px;
    white-space: nowrap;
  }

  .emoji-option {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 18px;
    padding: 2px 3px;
    border-radius: 8px;
    transition:
      transform var(--motion-base) var(--ease-spring),
      background var(--motion-fast) var(--ease-standard);
    line-height: 1;
  }

  .emoji-option:hover {
    transform: scale(1.25);
    background: rgba(0, 0, 0, 0.04);
  }

  .emoji-option:active {
    transform: scale(1.05);
    transition-duration: var(--motion-instant);
  }

  .emoji-option.reacted {
    background: rgba(244, 126, 58, 0.12);
  }

  .menu {
    position: absolute;
    right: calc(100% + 6px);
    top: 50%;
    /* Centring lives on `translate` so `transform` stays free for transitions. */
    translate: 0 -50%;
    display: flex;
    flex-direction: column;
    background: white;
    border: 2px solid #ebebeb;
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    z-index: 10;
    overflow: hidden;
    min-width: 110px;
    padding: 4px;
  }

  .menu-item {
    background: none;
    border: none;
    cursor: pointer;
    padding: 7px 12px;
    border-radius: 9px;
    font-size: 13px;
    font-family: inherit;
    font-weight: 500;
    text-align: left;
    display: flex;
    align-items: center;
    gap: 8px;
    transition:
      background var(--motion-fast) var(--ease-standard),
      color var(--motion-fast) var(--ease-standard);
  }

  .edit {
    color: #2a2a2a;
  }

  .edit:hover {
    background: rgba(0, 0, 0, 0.04);
  }

  .delete {
    color: #c0392b;
  }

  .delete:hover {
    background: rgba(192, 57, 43, 0.07);
  }
</style>
