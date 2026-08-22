<script lang="ts">
  import Icon from '$src/components/common/icons/Icon.svelte'
  import { backdrop, modalIn, pressable } from '$src/animations'

  interface Props {
    open: boolean
    src: string
    fileName: string
    onClose: () => void
    onDownload: () => void
  }

  let { open, src, fileName, onClose, onDownload }: Props = $props()

  function handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') onClose()
  }

  function handleBackdropClick(e: MouseEvent): void {
    if (e.target === e.currentTarget) onClose()
  }
</script>

<svelte:window onkeydown={open ? handleKeydown : undefined} />

{#if open}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="backdrop" onclick={handleBackdropClick} onkeydown={() => {}} transition:backdrop>
    <div class="topbar">
      <span class="filename" title={fileName}>{fileName}</span>
      <div class="actions">
        <button
          class="action-btn"
          type="button"
          onclick={onDownload}
          title="Download"
          aria-label="Download"
          use:pressable
        >
          <Icon name="download" size={16} strokeWidth={2} color="white" />
        </button>
        <button
          class="action-btn"
          type="button"
          onclick={onClose}
          title="Close"
          aria-label="Close"
          use:pressable
        >
          <Icon name="close" size={16} strokeWidth={2} color="white" />
        </button>
      </div>
    </div>

    <img class="preview" {src} alt={fileName} transition:modalIn={{ start: 0.9 }} />
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
    cursor: zoom-out;
  }

  .topbar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.5), transparent);
    pointer-events: none;
  }

  .filename {
    color: white;
    font-size: 13px;
    font-weight: 500;
    max-width: 60vw;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    pointer-events: auto;
  }

  .actions {
    display: flex;
    gap: 8px;
    pointer-events: auto;
  }

  .action-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: none;
    background: rgba(255, 255, 255, 0.12);
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    transition: background 0.15s;
  }

  .action-btn:hover {
    background: rgba(255, 255, 255, 0.22);
  }

  .preview {
    max-width: 92vw;
    max-height: 92vh;
    object-fit: contain;
    border-radius: 8px;
    cursor: default;
    box-shadow: 0 8px 40px rgba(0, 0, 0, 0.5);
  }
</style>
