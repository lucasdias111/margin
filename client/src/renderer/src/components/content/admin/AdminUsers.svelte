<script lang="ts">
  import { onMount } from 'svelte'
  import Button from '$src/components/common/buttons/Button.svelte'
  import ConfirmationModal from '$src/components/common/modals/ConfirmationModal.svelte'
  import CopyLink from '$src/components/content/admin/CopyLink.svelte'
  import { adminService } from '$src/services/AdminService'
  import { sessionState } from '$src/states/SessionState.svelte'
  import type { AccountSummary } from '$src/interfaces/Admin'
  import { formatLastSeen } from '$src/utils/DateUtils'

  let users = $state<AccountSummary[]>([])
  let loaded = $state(false)
  let query = $state('')
  let newName = $state('')
  let newEmail = $state('')
  // The one link on show, with whom it is for: a new account's or a password reset.
  let shownLink = $state<{ label: string; link: string } | null>(null)
  let pendingDelete = $state<AccountSummary | null>(null)

  const pending = $derived(users.filter((u) => u.status === 'PENDING_APPROVAL'))
  const others = $derived(
    users
      .filter((u) => u.status !== 'PENDING_APPROVAL')
      .filter((u) =>
        `${u.displayName} ${u.email}`.toLowerCase().includes(query.trim().toLowerCase())
      )
  )

  onMount(refresh)

  async function refresh(): Promise<void> {
    users = await adminService.users()
    loaded = true
  }

  async function act(action: () => Promise<unknown>): Promise<void> {
    try {
      await action()
    } finally {
      await refresh()
    }
  }

  async function createUser(): Promise<void> {
    if (!newName.trim() || !newEmail.trim()) return
    const link = await adminService.createUser(newName.trim(), newEmail.trim())
    shownLink = { label: `Send this to ${newName.trim()} so they can set a password`, link }
    newName = ''
    newEmail = ''
    await refresh()
  }

  async function showResetLink(user: AccountSummary): Promise<void> {
    const link = await adminService.resetLink(user.id)
    shownLink = { label: `One-time password reset link for ${user.displayName}`, link }
  }

  function isSelf(user: AccountSummary): boolean {
    return user.id === sessionState.currentUser?.id
  }
</script>

{#snippet userRow(user: AccountSummary)}
  <div class="admin-row">
    <div class="admin-row-main">
      <span class="admin-row-title">
        {user.displayName}
        {#if user.role === 'ADMIN'}<span class="admin-badge">Admin</span>{/if}
        {#if user.status === 'DISABLED'}<span class="admin-badge warn">Disabled</span>{/if}
        {#if user.status === 'PENDING_APPROVAL'}<span class="admin-badge warn">Waiting</span>{/if}
      </span>
      <span class="admin-row-meta">{user.email} · {formatLastSeen(user.lastSeenAt)}</span>
    </div>
    <div class="admin-row-actions">
      {#if user.status === 'PENDING_APPROVAL'}
        <Button
          buttonType="primary"
          size="small"
          text="Approve"
          onClick={() => act(() => adminService.setStatus(user.id, 'ACTIVE'))}
        />
      {:else if !isSelf(user)}
        <Button
          buttonType="secondary"
          size="small"
          text={user.status === 'DISABLED' ? 'Enable' : 'Disable'}
          onClick={() =>
            act(() =>
              adminService.setStatus(user.id, user.status === 'DISABLED' ? 'ACTIVE' : 'DISABLED')
            )}
        />
        <Button
          buttonType="secondary"
          size="small"
          text={user.role === 'ADMIN' ? 'Remove admin' : 'Make admin'}
          onClick={() =>
            act(() => adminService.setRole(user.id, user.role === 'ADMIN' ? 'USER' : 'ADMIN'))}
        />
      {/if}
      <Button
        buttonType="secondary"
        size="small"
        text="Reset link"
        onClick={() => showResetLink(user)}
      />
      {#if !isSelf(user)}
        <Button
          buttonType="delete"
          size="small"
          text={user.status === 'PENDING_APPROVAL' ? 'Reject' : 'Delete'}
          onClick={() => (pendingDelete = user)}
        />
      {/if}
    </div>
  </div>
{/snippet}

{#if shownLink}
  <section class="admin-section">
    <span class="admin-label">{shownLink.label}</span>
    <CopyLink link={shownLink.link} onDismiss={() => (shownLink = null)} />
  </section>
{/if}

{#if pending.length > 0}
  <section class="admin-section">
    <h3 class="admin-section-title">Waiting for approval</h3>
    {#each pending as user (user.id)}
      {@render userRow(user)}
    {/each}
  </section>
{/if}

<section class="admin-section">
  <h3 class="admin-section-title">Accounts</h3>
  <input class="admin-input" placeholder="Search by name or email" bind:value={query} />
  {#if !loaded}
    <p class="admin-hint">Loading…</p>
  {:else}
    {#each others as user (user.id)}
      {@render userRow(user)}
    {:else}
      <p class="admin-hint">No accounts match.</p>
    {/each}
  {/if}
</section>

<div class="admin-divider"></div>

<section class="admin-section">
  <h3 class="admin-section-title">Create an account</h3>
  <p class="admin-hint">You'll get a link to send them; they set their own password with it.</p>
  <div class="create-row">
    <input class="admin-input" placeholder="Display name" bind:value={newName} />
    <input class="admin-input" type="email" placeholder="Email" bind:value={newEmail} />
    <Button
      buttonType="primary"
      size="small"
      text="Create"
      disabled={!newName.trim() || !newEmail.trim()}
      onClick={createUser}
    />
  </div>
</section>

<ConfirmationModal
  open={pendingDelete !== null}
  title={pendingDelete?.status === 'PENDING_APPROVAL' ? 'Reject account' : 'Delete account'}
  message={`This permanently deletes ${pendingDelete?.displayName ?? 'this account'} and removes them from every margin. This cannot be undone.`}
  confirmLabel="Delete account"
  variant="delete"
  onConfirm={() => {
    const user = pendingDelete
    pendingDelete = null
    if (user) act(() => adminService.deleteUser(user.id))
  }}
  onClose={() => (pendingDelete = null)}
/>

<style>
  .create-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
  }

  .create-row input {
    flex: 1;
    min-width: 140px;
  }
</style>
