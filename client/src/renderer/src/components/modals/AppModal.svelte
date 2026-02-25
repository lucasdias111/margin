<script lang="ts">
  import type { Snippet } from 'svelte'

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
  <div class="backdrop" onclick={handleBackdropClick} onkeydown={() => {}}>
    <div class="modal" role="dialog" aria-modal="true">
      <div class="modal-header">
        {#if title}<h2>{title}</h2>{/if}
        <button class="close-btn" onclick={onClose} aria-label="Close">✕</button>
      </div>
      <div class="modal-body">
        {@render children()}
      </div>
    </div>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(45, 45, 45, 0.4);
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
  }
</style>
