<script lang="ts">
  let {
    open,
    title,
    html,
    onClose
  }: {
    open: boolean
    title: string
    html: string
    onClose: () => void
  } = $props()

  function handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') onClose()
  }
</script>

{#if open}
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div class="overlay" role="dialog" aria-modal="true" aria-label={title} onkeydown={handleKeydown}>
    <div class="modal">
      <div class="modal-header">
        <h2 class="modal-title">{title}</h2>
        <button class="close-btn" onclick={onClose} aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <div class="modal-body legal-content">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html html}
      </div>
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 24px;
  }

  .modal {
    background: #fff;
    border-radius: 14px;
    width: 100%;
    max-width: 680px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.18);
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px 16px;
    border-bottom: 1px solid #f0f0f0;
    flex-shrink: 0;
  }

  .modal-title {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: #1a1a1a;
  }

  .close-btn {
    background: none;
    border: none;
    padding: 4px;
    cursor: pointer;
    color: #aaa;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.15s, background 0.15s;
  }

  .close-btn:hover {
    color: #555;
    background: rgba(0, 0, 0, 0.05);
  }

  .modal-body {
    overflow-y: auto;
    padding: 20px 24px 24px;
    flex: 1;
  }

  .legal-content :global(h1) {
    font-size: 1.1rem;
    font-weight: 700;
    color: #1a1a1a;
    margin: 0 0 16px;
  }

  .legal-content :global(h2) {
    font-size: 0.9rem;
    font-weight: 700;
    color: #1a1a1a;
    margin: 20px 0 6px;
  }

  .legal-content :global(h3) {
    font-size: 0.85rem;
    font-weight: 600;
    color: #333;
    margin: 14px 0 4px;
  }

  .legal-content :global(p) {
    font-size: 0.82rem;
    color: #444;
    line-height: 1.65;
    margin: 0 0 10px;
  }

  .legal-content :global(ul) {
    font-size: 0.82rem;
    color: #444;
    line-height: 1.65;
    margin: 0 0 10px;
    padding-left: 20px;
  }

  .legal-content :global(li) {
    margin-bottom: 4px;
  }

  .legal-content :global(table) {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.8rem;
    margin: 8px 0 12px;
  }

  .legal-content :global(th) {
    text-align: left;
    padding: 6px 8px;
    background: #f7f7f7;
    font-weight: 600;
    color: #333;
    border: 1px solid #e8e8e8;
  }

  .legal-content :global(td) {
    padding: 6px 8px;
    color: #555;
    border: 1px solid #e8e8e8;
  }

  .legal-content :global(strong) {
    color: #1a1a1a;
    font-weight: 600;
  }
</style>