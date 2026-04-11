<script lang="ts">
  import { chatState } from '$src/states/ChatState.svelte.js'
  import { MarginRole } from '$src/interfaces/Margin'
  import { userState } from '$src/states/UserState.svelte.js'
  import { announcementService } from '$src/services/AnnouncementService.js'
  import type { Announcement } from '$src/interfaces/Announcement'
  import CreateOrEditAnnouncementModal from '$src/components/content/margin/announcement/modals/CreateOrEditAnnouncementModal.svelte'
  import AnnouncementCard from '$src/components/content/margin/announcement/AnnouncementCard.svelte'
  import MarginIcon from '$src/components/content/margin/MarginIcon.svelte'
  import Icon from '$src/components/common/icons/Icon.svelte'
  import Button from '$src/components/common/buttons/Button.svelte'

  const currentUserRole = $derived(
    chatState.selectedMargin?.members.find((m) => m.user.id === userState.currentUser?.id)?.role
  )
  const canManage = $derived(
    currentUserRole === MarginRole.ADMIN || currentUserRole === MarginRole.OWNER
  )

  let announcements = $state<Announcement[]>([])
  let modalOpen = $state(false)
  let editTarget = $state<Announcement | undefined>(undefined)
  let editModalOpen = $state(false)

  $effect(() => {
    const marginId = chatState.selectedMargin?.marginId
    if (!marginId) return
    announcementService.getAnnouncements(marginId).then((result) => {
      announcements = result
    })
  })

  async function handleCreateAnnouncement(title: string, content: string): Promise<void> {
    const marginId = chatState.selectedMargin?.marginId
    if (!marginId) return
    const created = await announcementService.createAnnouncement(marginId, title, content)
    announcements = [created, ...announcements]
  }

  function handleEdit(announcement: Announcement): void {
    editTarget = announcement
    editModalOpen = true
  }

  async function handleDelete(announcementId: number): Promise<void> {
    await announcementService.deleteAnnouncement(announcementId, chatState.selectedMargin?.marginId)
    announcements = announcements.filter((a) => a.announcementId !== announcementId)
  }

  async function handleUpdateAnnouncement(title: string, content: string): Promise<void> {
    if (!editTarget) return
    const updated = await announcementService.updateAnnouncement({ ...editTarget, title, content })
    announcements = announcements.map((a) =>
      a.announcementId === updated.announcementId ? updated : a
    )
  }
</script>

<div class="margin-home">
  <div class="welcome-card">
    <div class="welcome-row">
      <div class="margin-icon">
        <MarginIcon marginIcon={chatState.selectedMargin?.marginIconUrl} width={75} height={75} />
      </div>
      <div class="welcome-info">
        <h1 class="margin-name">{chatState.selectedMargin?.marginName}</h1>
        {#if chatState.selectedMargin?.marginDescription}
          <p class="margin-description">{chatState.selectedMargin.marginDescription}</p>
        {/if}
      </div>
      {#if canManage}
        <Button
          buttonType="primary"
          size="small"
          onClick={() => (chatState.currentlySelectedContent = 'manage')}
          text="Manage"
        />
      {/if}
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
        {#each announcements as announcement (announcement.announcementId)}
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

<style>
  .margin-home {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 28px;
    overflow-y: auto;
    background: white;
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
    color: #f47e3a;
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
