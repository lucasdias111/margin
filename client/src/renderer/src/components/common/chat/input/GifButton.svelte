<script lang="ts">
  import { clickOutside } from '$src/actions/clickOutside'
  import GifPicker from '$src/components/common/chat/GifPicker.svelte'
  import type { Gif } from '$src/services/GifService'
  import { pressable, scaleFade } from '$src/animations'

  let { onSelect }: { onSelect: (gif: Gif) => void } = $props()

  let showGifPicker = $state(false)

  function handleSelect(gif: Gif): void {
    onSelect(gif)
    showGifPicker = false
  }
</script>

<div class="emoji-wrapper" use:clickOutside={() => (showGifPicker = false)}>
  {#if showGifPicker}
    <div class="picker-container" transition:scaleFade={{ start: 0.94, origin: 'bottom right' }}>
      <GifPicker onSelect={handleSelect} />
    </div>
  {/if}
  <button
    class="secondary-button gif-button"
    type="button"
    onclick={() => (showGifPicker = !showGifPicker)}
    use:pressable={{ scale: 0.9 }}
    aria-label="Insert GIF"
    title="Insert GIF"
  >
    GIF
  </button>
</div>

<style>
  .emoji-wrapper {
    position: relative;
  }

  .picker-container {
    position: absolute;
    bottom: 55px;
    right: 0;
    z-index: 100;
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
    transition:
      background-color var(--motion-fast) var(--ease-standard),
      border-color var(--motion-fast) var(--ease-standard);
  }

  .secondary-button:hover {
    background-color: #fae0c8;
  }

  .gif-button {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.05em;
    color: #f47e3a;
  }
</style>
