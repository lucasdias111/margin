<script lang="ts">
  import type { Channel } from '$src/interfaces/Channel'
  import type { StoredFile } from '$src/interfaces/StoredFile'
  import { fileStorageService } from '$src/services/FileStorageService'
  import { sessionState } from '$src/states/SessionState.svelte.js'
  import { subscriptionState } from '$src/states/SubscriptionState.svelte'
  import { upgradeState } from '$src/states/UpgradeState.svelte'
  import Icon from '$src/components/common/icons/Icon.svelte'
  import FileRow from '$src/components/common/files/FileRow.svelte'

  let {
    channel,
    fileCount = $bindable(0)
  }: {
    channel: Channel | null
    fileCount: number
  } = $props()

  let channelFiles = $state<StoredFile[]>([])
  let isUploading = $state(false)
  let fileInput: HTMLInputElement

  const canUploadFiles = $derived(
    (subscriptionState.subscription?.limits.maxStorageGb ?? 1) > 0
  )

  $effect(() => {
    const channelId = channel?.id
    if (!channelId) {
      channelFiles = []
      return
    }
    fileStorageService.getChannelFiles(channelId).then((result) => {
      channelFiles = result
    })
  })

  $effect(() => {
    fileCount = channelFiles.length
  })

  async function handleUploadClick(): Promise<void> {
    if (!canUploadFiles) {
      upgradeState.show({
        tier: subscriptionState.subscription?.tier ?? null,
        limit: 'STORAGE',
        message: 'Upgrade your plan to share files in channels.'
      })
      return
    }
    fileInput.click()
  }

  async function handleFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file || !channel?.id) return
    isUploading = true
    const uploaded = await fileStorageService.uploadChannelFile(channel.id, file)
    if (uploaded) {
      channelFiles = [uploaded, ...channelFiles]
    }
    isUploading = false
    input.value = ''
  }

  async function handleDownloadFile(file: StoredFile): Promise<void> {
    await fileStorageService.downloadFile(file.fileId)
  }

  async function handleDeleteFile(file: StoredFile): Promise<void> {
    await fileStorageService.deleteFile(file.fileId)
    channelFiles = channelFiles.filter((f) => f.fileId !== file.fileId)
  }

  async function handleRenameFile(file: StoredFile, newName: string): Promise<void> {
    const updated = await fileStorageService.renameFile(file.fileId, newName)
    if (updated) {
      channelFiles = channelFiles.map((f) => (f.fileId === updated.fileId ? updated : f))
    }
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
  <button
    class="upload-btn"
    class:locked={!canUploadFiles}
    onclick={handleUploadClick}
    disabled={isUploading}
    title={!canUploadFiles ? 'Upgrade your plan to upload files' : undefined}
  >
    {#if isUploading}
      <Icon name="upload" size={12} strokeWidth={2} />
      Uploading…
    {:else if !canUploadFiles}
      <Icon name="lock" size={12} strokeWidth={2} />
      Upgrade to upload
    {:else}
      <Icon name="upload" size={12} strokeWidth={2} />
      Upload file
    {/if}
  </button>

  {#if channelFiles.length === 0}
    <p class="files-empty">No files shared yet</p>
  {:else}
    <div class="files-list">
      {#each channelFiles as file (file.fileId)}
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

  .upload-btn:hover:not(:disabled):not(.locked) {
    background: rgba(0, 0, 0, 0.07);
    border-color: rgba(0, 0, 0, 0.22);
    color: #555;
  }

  .upload-btn:disabled:not(.locked) {
    cursor: default;
    opacity: 0.6;
  }

  .upload-btn.locked {
    border-style: dashed;
    color: #bbb;
    cursor: pointer;
  }

  .upload-btn.locked:hover {
    border-color: rgba(0, 0, 0, 0.2);
    color: #999;
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