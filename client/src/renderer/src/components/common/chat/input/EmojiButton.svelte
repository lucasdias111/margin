<script lang="ts">
  import { Picker } from 'emoji-mart'
  import data from '@emoji-mart/data'
  import { clickOutside } from '$src/actions/clickOutside'

  let { onSelect }: { onSelect: (emoji: string) => void } = $props()

  let showPicker = $state(false)

  function emojiPicker(node: HTMLElement): { destroy(): void } {
    const picker = new Picker({
      data,
      onEmojiSelect: (emoji: any) => {
        onSelect(emoji.native)
        showPicker = false
      }
    })
    node.appendChild(picker as unknown as Node)
    return {
      destroy() {
        node.innerHTML = ''
      }
    }
  }
</script>

<div class="emoji-wrapper" use:clickOutside={() => (showPicker = false)}>
  <div class="picker-container" class:visible={showPicker} use:emojiPicker></div>
  <button
    class="secondary-button"
    type="button"
    onclick={() => (showPicker = !showPicker)}
    aria-label="Insert emoji"
    title="Insert emoji"
  >
    😊
  </button>
</div>

<style>
  .emoji-wrapper {
    position: relative;
  }

  .picker-container {
    display: none;
    position: absolute;
    bottom: 55px;
    right: 0;
    z-index: 100;
  }

  .picker-container.visible {
    display: block;
  }

  .secondary-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    border-radius: 999px;
    background-color: #ffffff;
    border: 1px solid #e4cbb2;
    cursor: pointer;
    flex-shrink: 0;
    padding: 0;
    font-size: 16px;
    transition: background-color 0.2s;
  }

  .secondary-button:hover {
    background-color: #fae0c8;
  }
</style>
