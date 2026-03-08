<script lang="ts">
  import { chatState } from '$src/states/ChatState.svelte.js'
  import marginLogo from '$src/assets/pics/margin.png'
  import { MarginRole } from '$src/interfaces/Margin'
  import { userState } from '$src/states/UserState.svelte.js'
  import { announcementService } from '$src/services/AnnouncementService.js'
  import type { Announcement } from '$src/interfaces/Announcement'
  import CreateOrEditAnnouncementModal from '$src/components/content/margin/announcement/modals/CreateOrEditAnnouncementModal.svelte'
  import AnnouncementCard from '$src/components/content/margin/announcement/AnnouncementCard.svelte'

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
    <div class="welcome-top">
      <div class="logo-mark">
        <img src=".{marginLogo}" alt="Margin Logo" class="logo" />
      </div>
      {#if canManage}
        <button class="manage-btn" onclick={() => (chatState.currentlySelectedContent = 'manage')}>
          Manage Margin
        </button>
      {/if}
    </div>
  </div>

  <div class="announcements-section">
    <div class="card-header">
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
      >
        <path
          d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"
        />
      </svg>
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
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-bottom: 20px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  }

  .welcome-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .logo-mark {
    line-height: 1;
  }
  .logo {
    width: 50%;
  }

  .manage-btn {
    padding: 7px 14px;
    background-color: #f47e3a;
    border: none;
    border-radius: 10px;
    color: #fff;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.15s;
    white-space: nowrap;
  }

  .manage-btn:hover {
    background-color: #e06b28;
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
</style>
