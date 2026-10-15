<script lang="ts">
  import { MarginRole } from '$src/interfaces/Margin'
  import { announcementService } from '$src/services/AnnouncementService.js'
  import type { Announcement } from '$src/interfaces/Announcement'
  import CreateOrEditAnnouncementModal from '$src/components/content/margin/announcement/modals/CreateOrEditAnnouncementModal.svelte'
  import AnnouncementCard from '$src/components/content/margin/announcement/AnnouncementCard.svelte'
  import MarginIcon from '$src/components/content/margin/MarginIcon.svelte'
  import Icon from '$src/components/common/icons/Icon.svelte'
  import Button from '$src/components/common/buttons/Button.svelte'
  import ConfirmationModal from '$src/components/common/modals/ConfirmationModal.svelte'
  import { marginService } from '$src/services/MarginService'
  import { navigationService } from '$src/services/NavigationService'
  import { View } from '$src/interfaces/View'
  import { navigationState } from '$src/states/NavigationState.svelte'
  import { sessionState } from '$src/states/SessionState.svelte'
  import { fileStorageService } from '$src/services/FileStorageService'
  import type { StoredFile } from '$src/interfaces/StoredFile'
  import { FileListStore } from '$src/composables/FileListStore.svelte'
  import FileRow from '$src/components/common/files/FileRow.svelte'

  const currentUserRole = $derived(
    navigationState.selectedMargin?.members.find((m) => m.user.id === sessionState.currentUser?.id)
      ?.role
  )
  const canManage = $derived(
    currentUserRole === MarginRole.ADMIN || currentUserRole === MarginRole.OWNER
  )

  let announcements = $state<Announcement[]>([])
  let modalOpen = $state(false)
  let editTarget = $state<Announcement | undefined>(undefined)
  let editModalOpen = $state(false)
  let leaveModalOpen = $state(false)

  const fileList = new FileListStore()
  let fileInputRef = $state<HTMLInputElement | null>(null)
  let isDraggingFile = $state(false)

  $effect(() => {
    const marginId = navigationState.selectedMargin?.marginId
    if (!marginId) {
      fileList.reset()
      return
    }
    announcementService.getAnnouncements(marginId).then((result) => {
      announcements = result
    })
    fileList.load(() => fileStorageService.getMarginFiles(marginId))
  })

  async function handleFileSelect(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement
    const files = input.files
    if (!files || files.length === 0) return
    await uploadFiles(Array.from(files))
    input.value = ''
  }

  async function uploadFiles(files: File[]): Promise<void> {
    const marginId = navigationState.selectedMargin?.marginId
    if (!marginId) return
    for (const file of files) {
      const uploaded = await fileStorageService.uploadMarginFile(marginId, file)
      if (uploaded) fileList.prepend(uploaded)
    }
  }

  async function handleDeleteFile(file: StoredFile): Promise<void> {
    await fileStorageService.deleteFile(file.fileId)
    fileList.remove(file.fileId)
  }

  async function handleDownloadFile(file: StoredFile): Promise<void> {
    await fileStorageService.downloadFile(file.fileId)
  }

  async function handleRenameFile(file: StoredFile, newName: string): Promise<void> {
    const updated = await fileStorageService.renameFile(file.fileId, newName)
    if (updated) fileList.replace(updated)
  }

  function canRenameFile(file: StoredFile): boolean {
    return canManage || file.uploadedBy.id === sessionState.currentUser?.id
  }

  function handleDragOver(event: DragEvent): void {
    if (!canManage) return
    event.preventDefault()
    isDraggingFile = true
  }

  function handleDragLeave(): void {
    isDraggingFile = false
  }

  async function handleDrop(event: DragEvent): Promise<void> {
    event.preventDefault()
    isDraggingFile = false
    if (!canManage) return
    const dropped = event.dataTransfer?.files
    if (!dropped || dropped.length === 0) return
    await uploadFiles(Array.from(dropped))
  }

  async function handleCreateAnnouncement(title: string, content: string): Promise<void> {
    const marginId = navigationState.selectedMargin?.marginId
    if (!marginId) return
    const created = await announcementService.createAnnouncement(marginId, title, content)
    announcements = [created, ...announcements]
  }

  function handleEdit(announcement: Announcement): void {
    editTarget = announcement
    editModalOpen = true
  }

  async function handleDelete(announcementId: number): Promise<void> {
    await announcementService.deleteAnnouncement(
      announcementId,
      navigationState.selectedMargin?.marginId
    )
    announcements = announcements.filter((a) => a.announcementId !== announcementId)
  }

  async function handleUpdateAnnouncement(title: string, content: string): Promise<void> {
    if (!editTarget) return
    const updated = await announcementService.updateAnnouncement({ ...editTarget, title, content })
    announcements = announcements.map((a) =>
      a.announcementId === updated.announcementId ? updated : a
    )
  }

  async function confirmLeaveMargin(marginId: number): Promise<void> {
    if (!marginId) return
    await marginService.removeMarginMember(marginId, sessionState.currentUser?.id)
    marginService.removeMargin(marginId)
  }

  async function handleLeaveMargin(): Promise<void> {
    leaveModalOpen = true
  }
</script>

<div class="pane margin-home">
  <div class="welcome-card">
    <div class="welcome-row">
      <div class="margin-icon">
        <MarginIcon
          marginIcon={navigationState.selectedMargin?.marginIconUrl}
          width={75}
          height={75}
        />
      </div>
      <div class="welcome-info">
        <h1 class="margin-name">{navigationState.selectedMargin?.marginName}</h1>
        {#if navigationState.selectedMargin?.marginDescription}
          <p class="margin-description">{navigationState.selectedMargin.marginDescription}</p>
        {/if}
      </div>
      {#if canManage}
        <Button
          buttonType="primary"
          size="small"
          onClick={() => navigationService.setView(View.Manage)}
          text="Manage"
        />
      {/if}
      <Button
        buttonType="danger"
        size="small"
        onClick={() => handleLeaveMargin()}
        text="Leave margin"
      />
    </div>
  </div>

  <div class="announcements-section">
    <div class="card-header">
      <Icon name="notifications" size={12} strokeWidth={2.5} />
      <span class="card-title">Announcements</span>
      {#if canManage}
        <button class="new-announcement-btn" onclick={() => (modalOpen = true)}>+ New</button>
      {/if}
    </div>

    {#if announcements.length === 0}
      <div class="card-empty">No announcements yet</div>
    {:else}
      <div class="announcement-list">
        {#each [...announcements].reverse() as announcement (announcement.announcementId)}
          <AnnouncementCard
            {announcement}
            {canManage}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        {/each}
      </div>
    {/if}
  </div>

  <div
    class="files-section"
    class:drag-over={isDraggingFile}
    ondragover={handleDragOver}
    ondragleave={handleDragLeave}
    ondrop={handleDrop}
    role="region"
    aria-label="Margin files"
  >
    <div class="card-header">
      <Icon name="file" size={12} strokeWidth={2.5} />
      <span class="card-title">Files</span>
      {#if canManage}
        <button class="new-file-btn" onclick={() => fileInputRef?.click()}>+ Upload</button>
        <input bind:this={fileInputRef} type="file" multiple hidden onchange={handleFileSelect} />
      {/if}
    </div>

    {#if !canManage}
      <p class="files-hint">Only admins and owners can share files with the whole margin.</p>
    {/if}

    {#if fileList.files.length === 0}
      <div class="card-empty">
        {#if canManage}
          No files shared yet — drop a file here or click upload.
        {:else}
          No files shared yet.
        {/if}
      </div>
    {:else}
      <div class="file-list">
        {#each fileList.files as file (file.fileId)}
          <FileRow
            {file}
            canDelete={canManage}
            canRename={canRenameFile(file)}
            onDownload={handleDownloadFile}
            onDelete={handleDeleteFile}
            onRename={handleRenameFile}
          />
        {/each}
      </div>
    {/if}

    {#if isDraggingFile && canManage}
      <div class="drop-overlay">Drop to upload</div>
    {/if}
  </div>
</div>

<CreateOrEditAnnouncementModal
  open={modalOpen}
  onClose={() => (modalOpen = false)}
  onSubmit={handleCreateAnnouncement}
/>

<CreateOrEditAnnouncementModal
  open={editModalOpen}
  initialTitle={editTarget?.title}
  initialContent={editTarget?.content}
  onClose={() => {
    editModalOpen = false
    editTarget = undefined
  }}
  onSubmit={handleUpdateAnnouncement}
/>

<ConfirmationModal
  open={leaveModalOpen}
  title="Remove member"
  message="Are you sure you want to leave this margin? You will lose access to all spaces and channels."
  confirmLabel="Remove"
  variant="delete"
  onConfirm={() => confirmLeaveMargin(navigationState.selectedMargin.marginId)}
  onClose={() => (leaveModalOpen = false)}
/>

<style>
  .margin-home {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 28px;
    overflow-y: auto;
    border-radius: 15px;
    min-height: 0;
  }

  .margin-home::-webkit-scrollbar {
    width: 4px;
  }

  .margin-home::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.08);
    border-radius: 4px;
  }

  .welcome-card {
    padding-bottom: 20px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  }

  .announcements-section {
    background: #f7f7fa;
    border-radius: 14px;
    padding: 16px 18px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .files-section {
    position: relative;
    background: #f7f7fa;
    border-radius: 14px;
    padding: 16px 18px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    border: 1px dashed transparent;
    transition:
      border-color 0.15s,
      background 0.15s;
  }

  .files-section.drag-over {
    border-color: #ff843c;
    background: rgba(255, 132, 60, 0.04);
  }

  .files-hint {
    margin: 0;
    font-size: 12px;
    color: #aaa;
  }

  .new-file-btn {
    font-size: 11px;
    font-weight: 700;
    color: #ff843c;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    letter-spacing: 0.02em;
    transition: color 0.15s;
  }

  .new-file-btn:hover {
    color: #e06b28;
  }

  .file-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .drop-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 132, 60, 0.08);
    border-radius: 14px;
    color: #ff843c;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.04em;
    pointer-events: none;
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #aaa;
    margin-bottom: 2px;
  }

  .card-title {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #aaa;
    flex: 1;
  }

  .new-announcement-btn {
    font-size: 11px;
    font-weight: 700;
    color: #ff843c;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    letter-spacing: 0.02em;
    transition: color 0.15s;
  }

  .new-announcement-btn:hover {
    color: #e06b28;
  }

  .card-empty {
    font-size: 13px;
    color: #ccc;
    padding: 8px 0;
  }

  .announcement-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .welcome-row {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .margin-icon {
    flex-shrink: 0;
    width: 100px;
    height: 100px;
    border-radius: 12px;
    overflow: hidden;
    background: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .welcome-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
  }

  .margin-name {
    font-size: 18px;
    font-weight: 700;
    color: #2a2a2a;
    margin: 0;
    letter-spacing: -0.01em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .margin-description {
    font-size: 14px;
    color: #999;
    margin: 0;
    line-height: 1.4;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
