<script lang="ts">
  import { onMount } from 'svelte'
  import Button from '$src/components/common/buttons/Button.svelte'
  import ConfirmationModal from '$src/components/common/modals/ConfirmationModal.svelte'
  import { adminService } from '$src/services/AdminService'
  import type { MarginOverview } from '$src/interfaces/Admin'
  import { formatTimestamp } from '$src/utils/DateUtils'
  import { formatFileSize } from '$src/utils/FileSizeUtils'

  let margins = $state<MarginOverview[]>([])
  let loaded = $state(false)
  let pendingDelete = $state<MarginOverview | null>(null)

  onMount(refresh)

  async function refresh(): Promise<void> {
    margins = await adminService.margins()
    loaded = true
  }

  async function remove(margin: MarginOverview): Promise<void> {
    await adminService.deleteMargin(margin.id)
    await refresh()
  }
</script>

<section class="admin-section">
  <p class="admin-hint">
    Admins see each margin's metadata, never its messages or files. Deleting a margin removes it for
    all its members.
  </p>
  {#if !loaded}
    <p class="admin-hint">Loading…</p>
  {/if}
  {#each margins as margin (margin.id)}
    <div class="admin-row">
      <div class="admin-row-main">
        <span class="admin-row-title">{margin.name}</span>
        <span class="admin-row-meta">
          {margin.owner ? `${margin.owner.displayName} (${margin.owner.email})` : 'No owner'} ·
          {margin.memberCount}
          {margin.memberCount === 1 ? 'member' : 'members'} · {formatFileSize(margin.storageBytes)} ·
          created {formatTimestamp(margin.createdAt)}
        </span>
      </div>
      <div class="admin-row-actions">
        <Button
          buttonType="delete"
          size="small"
          text="Delete"
          onClick={() => (pendingDelete = margin)}
        />
      </div>
    </div>
  {:else}
    {#if loaded}<p class="admin-hint">No margins yet.</p>{/if}
  {/each}
</section>

<ConfirmationModal
  open={pendingDelete !== null}
  title="Delete margin"
  message={`This deletes ${pendingDelete?.name ?? 'this margin'} with all its spaces, channels, messages and files, for every member. This cannot be undone.`}
  confirmLabel="Delete margin"
  variant="delete"
  onConfirm={() => {
    const margin = pendingDelete
    pendingDelete = null
    if (margin) remove(margin)
  }}
  onClose={() => (pendingDelete = null)}
/>
