<script lang="ts">
  import type { Channel } from '$src/interfaces/Channel'
  import type { StoredFile } from '$src/interfaces/StoredFile'
  import { fileStorageService } from '$src/services/FileStorageService'
  import { sessionState } from '$src/states/SessionState.svelte.js'
  import { FileListStore } from '$src/composables/FileListStore.svelte'
  import Icon from '$src/components/common/icons/Icon.svelte'
  import FileRow from '$src/components/common/files/FileRow.svelte'

  let {
    channel,
    fileCount = $bindable(0)
  }: {
    channel: Channel | null
    fileCount: number
  } = $props()

  const fileList = new FileListStore()
  let isUploading = $state(false)
  let fileInput: HTMLInputElement

  $effect(() => {
    const channelId = channel?.id
    if (!channelId) {
      fileList.reset()
      return
    }
    fileList.load(() => fileStorageService.getChannelFiles(channelId))
  })

  $effect(() => {
    fileCount = fileList.files.length
  })

  async function handleUploadClick(): Promise<void> {
    fileInput.click()
  }

  async function handleFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file || !channel?.id) return
    isUploading = true
    const uploaded = await fileStorageService.uploadChannelFile(channel.id, file)
    if (uploaded) fileList.prepend(uploaded)
    isUploading = false
    input.value = ''
  }

  async function handleDownloadFile(file: StoredFile): Promise<void> {
    await fileStorageService.downloadFile(file.fileId)
  }

  async function handleDeleteFile(file: StoredFile): Promise<void> {
    await fileStorageService.deleteFile(file.fileId)
    fileList.remove(file.fileId)
  }

  async function handleRenameFile(file: StoredFile, newName: string): Promise<void> {
    const updated = await fileStorageService.renameFile(file.fileId, newName)
    if (updated) fileList.replace(updated)
  }

  function canDeleteFile(file: StoredFile): boolean {
    return file.uploadedBy.id === sessionState.currentUser?.id
  }

  function canRenameFile(file: StoredFile): boolean {
    return file.uploadedBy.id === sessionState.currentUser?.id
  }
</script>

<section class="files-section">
  <input
    bind:this={fileInput}
    type="file"
    class="file-input-hidden"
    onchange={handleFileSelected}
  />
  <button class="upload-btn" onclick={handleUploadClick} disabled={isUploading}>
    {#if isUploading}
      <Icon name="upload" size={12} strokeWidth={2} />
      Uploading…
    {:else}
      <Icon name="upload" size={12} strokeWidth={2} />
      Upload file
    {/if}
  </button>

  {#if fileList.files.length === 0}
    <p class="files-empty">No files shared yet</p>
  {:else}
    <div class="files-list">
      {#each fileList.files as file (file.fileId)}
        <FileRow
          {file}
          compact
          canDelete={canDeleteFile(file)}
          canRename={canRenameFile(file)}
          onDownload={handleDownloadFile}
          onDelete={handleDeleteFile}
          onRename={handleRenameFile}
        />
      {/each}
    </div>
  {/if}
</section>

<style>
  .files-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .file-input-hidden {
    display: none;
  }

  .upload-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 7px 0;
    background: rgba(0, 0, 0, 0.04);
    border: 1px dashed rgba(0, 0, 0, 0.13);
    border-radius: 8px;
    font-size: 12px;
    font-weight: 500;
    color: #888;
    cursor: pointer;
    font-family: inherit;
    transition:
      background 0.15s,
      border-color 0.15s,
      color 0.15s;
  }

  .upload-btn:hover:not(:disabled) {
    background: rgba(0, 0, 0, 0.07);
    border-color: rgba(0, 0, 0, 0.22);
    color: #555;
  }

  .upload-btn:disabled {
    cursor: default;
    opacity: 0.6;
  }

  .files-empty {
    margin: 0;
    padding: 2px 4px;
    font-size: 12px;
    color: #bbb;
  }

  .files-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
</style>
