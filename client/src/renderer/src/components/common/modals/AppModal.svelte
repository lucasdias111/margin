<script lang="ts">
  import type { Snippet } from 'svelte'
  import { autoHeight, backdrop, modalIn, pressable } from '$src/animations'

  interface Props {
    open: boolean
    title?: string
    onClose: () => void
    children: Snippet
  }

  let { open, title, onClose, children }: Props = $props()

  function handleBackdropClick(e: MouseEvent): void {
    if (e.target === e.currentTarget) onClose()
  }
</script>

{#if open}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="backdrop modal-overlay"
    onclick={handleBackdropClick}
    onkeydown={() => {}}
    transition:backdrop
  >
    <div class="modal" role="dialog" aria-modal="true" transition:modalIn>
      <div class="modal-header">
        {#if title}<h2 class="modal-title">{title}</h2>{/if}
        <button
          class="close-btn"
          onclick={onClose}
          aria-label="Close"
          use:pressable={{ scale: 0.85 }}>✕</button
        >
      </div>
      <div class="modal-body" use:autoHeight>
        <div class="modal-body-content">
          {@render children()}
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(45, 45, 45, 0.4);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }

  .modal {
    background: #fff;
    border-radius: 12px;
    padding: 24px;
    min-width: 360px;
    max-width: 90vw;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  }

  .modal-body-content {
    display: flow-root;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  .modal-header h2 {
    font-size: 1.1rem;
    font-weight: 600;
    margin: 0;
    color: #2d2d2d;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 1rem;
    cursor: pointer;
    color: #888;
    padding: 4px;
    line-height: 1;
    border-radius: 6px;
    transition:
      color var(--motion-fast) var(--ease-standard),
      background-color var(--motion-fast) var(--ease-standard);
  }

  .close-btn:hover {
    color: #2d2d2d;
    background-color: rgba(0, 0, 0, 0.05);
  }
</style>
