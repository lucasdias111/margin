<script lang="ts">
  import Icon from '$src/components/common/icons/Icon.svelte'
  import { formatFileSize } from '$src/utils/FileSizeUtils'
  import { SvelteMap } from 'svelte/reactivity'

  interface PendingFile {
    file: File
    inline: boolean
  }

  let {
    gifPreviewUrl,
    pendingFiles,
    onRemoveGif,
    onRemoveFile
  }: {
    gifPreviewUrl: string | null
    pendingFiles: PendingFile[]
    onRemoveGif: () => void
    onRemoveFile: (index: number) => void
  } = $props()

  let previewUrls = $state<Map<File, string>>(new Map())

  $effect(() => {
    const urls = new SvelteMap<File, string>()
    for (const { file } of pendingFiles) {
      if (file.type.startsWith('image/')) urls.set(file, URL.createObjectURL(file))
    }
    previewUrls = urls
    return () => {
      for (const url of urls.values()) URL.revokeObjectURL(url)
    }
  })
</script>

<div class="preview-bar">
  {#if gifPreviewUrl}
    <div class="preview-card">
      <img src={gifPreviewUrl} alt="GIF preview" />
      <button type="button" class="remove-preview" onclick={onRemoveGif} title="Remove GIF">
        <Icon name="close" size={14} color="white" />
      </button>
    </div>
  {/if}

  {#each pendingFiles as pending, i (i + '-' + pending.file.name + '-' + pending.file.size)}
    {#if previewUrls.has(pending.file)}
      <div class="preview-card" title={pending.file.name}>
        <img src={previewUrls.get(pending.file)} alt={pending.file.name} />
        <button
          type="button"
          class="remove-preview"
          onclick={() => onRemoveFile(i)}
          title="Remove image"
          aria-label="Remove image"
        >
          <Icon name="close" size={12} color="white" />
        </button>
      </div>
    {:else}
      <div class="file-chip" title={pending.file.name}>
        <div class="file-chip-icon">
          <Icon name="file" size={14} strokeWidth={1.8} />
        </div>
        <div class="file-chip-meta">
          <span class="file-chip-name">{pending.file.name}</span>
          <span class="file-chip-size">{formatFileSize(pending.file.size)}</span>
        </div>
        <button
          type="button"
          class="remove-preview file-chip-remove"
          onclick={() => onRemoveFile(i)}
          title="Remove file"
          aria-label="Remove file"
        >
          <Icon name="close" size={12} color="white" />
        </button>
      </div>
    {/if}
  {/each}
</div>

<style>
  .preview-bar {
    padding: 12px 18px 0 18px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }

  .file-chip {
    position: relative;
    display: flex;
    align-items: center;
    gap: 8px;
    height: 40px;
    padding: 0 28px 0 8px;
    background: #ffffff;
    border: 1px solid #e4cbb2;
    border-radius: 10px;
    max-width: 240px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  }

  .file-chip-icon {
    flex-shrink: 0;
    width: 26px;
    height: 26px;
    border-radius: 7px;
    background: rgba(255, 132, 60, 0.12);
    color: #ff843c;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .file-chip-meta {
    display: flex;
    flex-direction: column;
    min-width: 0;
    line-height: 1.1;
  }

  .file-chip-name {
    font-size: 12px;
    font-weight: 600;
    color: #2a2a2a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 160px;
  }

  .file-chip-size {
    font-size: 10px;
    color: #aaa;
  }

  .file-chip-remove {
    top: 50%;
    right: 4px;
    transform: translateY(-50%);
    width: 18px;
    height: 18px;
  }

  .file-chip-remove:hover {
    transform: translateY(-50%);
  }

  .preview-card {
    position: relative;
    width: 64px;
    height: 64px;
    border-radius: 12px;
    overflow: hidden;
    border: 2px solid #ff843c;
    background: #f9f9f9;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .preview-card img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .remove-preview {
    position: absolute;
    top: 2px;
    right: 2px;
    background: rgba(0, 0, 0, 0.6);
    border: none;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    padding: 0;
    box-sizing: border-box;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
  }

  .remove-preview:hover {
    background: rgba(255, 0, 0, 0.7);
  }
</style>
