<script lang="ts">
  import Icon from '$src/components/common/icons/Icon.svelte'
  import type { StoredFile } from '$src/interfaces/StoredFile'
  import { formatFileSize } from '$src/utils/FileSizeUtils'

  let {
    file,
    canDelete = false,
    canRename = false,
    compact = false,
    onDownload,
    onDelete,
    onRename
  }: {
    file: StoredFile
    canDelete?: boolean
    canRename?: boolean
    compact?: boolean
    onDownload?: (file: StoredFile) => void
    onDelete?: (file: StoredFile) => void
    onRename?: (file: StoredFile, newName: string) => void | Promise<void>
  } = $props()

  let isRenaming = $state(false)
  let renameInput = $state('')
  let renameInputRef = $state<HTMLInputElement | null>(null)

  function startRename(): void {
    if (!canRename) return
    renameInput = file.fileName
    isRenaming = true
    queueMicrotask(() => renameInputRef?.select())
  }

  function cancelRename(): void {
    isRenaming = false
  }

  function commitRename(): void {
    const trimmed = renameInput.trim()
    if (!trimmed || trimmed === file.fileName) {
      isRenaming = false
      return
    }
    onRename?.(file, trimmed)
    isRenaming = false
  }

  function handleRenameKey(e: KeyboardEvent): void {
    if (e.key === 'Enter') {
      e.preventDefault()
      commitRename()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancelRename()
    }
  }
</script>

<div class="file-row" class:compact>
  <div class="file-icon">
    <Icon name="file" size={compact ? 14 : 16} strokeWidth={1.8} />
  </div>
  <div class="file-body">
    {#if isRenaming}
      <input
        bind:this={renameInputRef}
        bind:value={renameInput}
        onkeydown={handleRenameKey}
        onblur={commitRename}
        class="file-name-input"
        type="text"
      />
    {:else}
      <p class="file-name" title={file.fileName} ondblclick={startRename}>{file.fileName}</p>
    {/if}
    <div class="file-bottom">
      <p class="file-sub">
        {#if !compact}
          {formatFileSize(file.sizeBytes)} · {file.uploadedBy.displayName}
        {:else}
          {formatFileSize(file.sizeBytes)}
        {/if}
      </p>
      <div class="file-actions">
        {#if canRename && !isRenaming}
          <button
            class="icon-btn"
            type="button"
            onclick={startRename}
            aria-label="Rename file"
            title="Rename"
          >
            <Icon name="edit" size={compact ? 12 : 14} strokeWidth={1.8} />
          </button>
        {/if}
        <button
          class="icon-btn"
          type="button"
          onclick={() => onDownload?.(file)}
          aria-label="Download file"
          title="Download"
        >
          <Icon name="download" size={compact ? 12 : 14} strokeWidth={1.8} />
        </button>
        {#if canDelete}
          <button
            class="icon-btn danger"
            type="button"
            onclick={() => onDelete?.(file)}
            aria-label="Delete file"
            title="Delete"
          >
            <Icon name="trash" size={compact ? 12 : 14} strokeWidth={1.8} />
          </button>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  .file-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    background: white;
    border: 1px solid rgba(0, 0, 0, 0.05);
    border-radius: 10px;
    transition:
      border-color 0.12s,
      box-shadow 0.12s;
  }

  .file-row:hover {
    border-color: rgba(255, 132, 60, 0.4);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  }

  .file-row.compact {
    padding: 6px 8px;
    gap: 8px;
  }

  .file-icon {
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    border-radius: 7px;
    background: rgba(255, 132, 60, 0.1);
    color: #ff843c;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .file-row.compact .file-icon {
    width: 22px;
    height: 22px;
    border-radius: 6px;
  }

  .file-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .file-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 4px;
  }

  .file-name {
    margin: 0;
    font-size: 13px;
    font-weight: 500;
    color: #2a2a2a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .file-row.compact .file-name {
    font-size: 12px;
  }

  .file-name-input {
    font: inherit;
    font-size: 13px;
    font-weight: 500;
    color: #2a2a2a;
    border: 1px solid #ff843c;
    border-radius: 6px;
    padding: 2px 6px;
    outline: none;
    width: 100%;
    box-sizing: border-box;
    background: white;
  }

  .file-row.compact .file-name-input {
    font-size: 12px;
  }

  .file-sub {
    margin: 0;
    font-size: 11px;
    color: #aaa;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .file-actions {
    display: flex;
    align-items: center;
    gap: 2px;
    flex-shrink: 0;
    opacity: 0;
    transition: opacity 0.15s;
  }

  .file-row:hover .file-actions,
  .file-row:focus-within .file-actions {
    opacity: 1;
  }

  .file-bottom .file-actions {
    opacity: 1;
  }

  .icon-btn {
    width: 24px;
    height: 24px;
    border-radius: 6px;
    border: none;
    background: none;
    color: #999;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    transition:
      background 0.12s,
      color 0.12s;
  }

  .icon-btn:hover {
    background: rgba(0, 0, 0, 0.06);
    color: #555;
  }

  .icon-btn.danger:hover {
    background: rgba(192, 57, 43, 0.1);
    color: #c0392b;
  }
</style>
