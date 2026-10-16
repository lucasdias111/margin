<script lang="ts">
  import AdminGeneral from '$src/components/content/admin/AdminGeneral.svelte'
  import AdminInviteCodes from '$src/components/content/admin/AdminInviteCodes.svelte'
  import AdminUsers from '$src/components/content/admin/AdminUsers.svelte'
  import AdminMargins from '$src/components/content/admin/AdminMargins.svelte'

  type Tab = 'general' | 'users' | 'invites' | 'margins'

  const tabs: { id: Tab; label: string }[] = [
    { id: 'general', label: 'General' },
    { id: 'users', label: 'Users' },
    { id: 'invites', label: 'Invite codes' },
    { id: 'margins', label: 'Margins' }
  ]

  let tab = $state<Tab>('general')
</script>

<div class="pane content admin">
  <div class="content-inner">
    <h2 class="page-title">Instance admin</h2>
    <div class="tabs" role="tablist">
      {#each tabs as { id, label } (id)}
        <button
          class="tab"
          class:selected={tab === id}
          role="tab"
          aria-selected={tab === id}
          onclick={() => (tab = id)}>{label}</button
        >
      {/each}
    </div>

    {#if tab === 'general'}
      <AdminGeneral />
    {:else if tab === 'users'}
      <AdminUsers />
    {:else if tab === 'invites'}
      <AdminInviteCodes />
    {:else}
      <AdminMargins />
    {/if}
  </div>
</div>

<style>
  .content {
    display: flex;
    justify-content: center;
    align-items: flex-start;
    width: 100%;
    height: 100%;
    padding: 40px;
    box-sizing: border-box;
    overflow-y: auto;
  }

  .content-inner {
    width: 100%;
    max-width: 640px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .page-title {
    margin: 0;
    font-size: 1.2rem;
    font-weight: 600;
    color: #1a1a1a;
  }

  .tabs {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
    border-bottom: 1px solid #f0f0f0;
  }

  .tab {
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    padding: 8px 12px;
    font-size: 0.85rem;
    font-weight: 500;
    color: #888;
    cursor: pointer;
    font-family: inherit;
  }

  .tab.selected {
    color: #1a1a1a;
    border-bottom-color: #ff843c;
  }

  @media (max-width: 768px) {
    .content {
      padding: 20px 16px;
    }
  }

  /* Shared by the admin tabs. */
  .admin :global(.admin-section) {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .admin :global(.admin-section-title) {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 600;
    color: #1a1a1a;
  }

  .admin :global(.admin-hint) {
    margin: 0;
    font-size: 0.8rem;
    color: #888;
    line-height: 1.5;
  }

  .admin :global(.admin-label) {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #aaa;
  }

  .admin :global(.admin-field) {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .admin :global(.admin-input),
  .admin :global(.admin-select) {
    height: 36px;
    border-radius: 8px;
    border: 1px solid #ece8e0;
    background: #f7f4ef;
    padding: 0 10px;
    font-size: 0.85rem;
    color: #1a1a1a;
    font-family: inherit;
    box-sizing: border-box;
  }

  .admin :global(.admin-check) {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.85rem;
    color: #333;
  }

  .admin :global(.admin-row) {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 10px;
    background: #faf8f5;
    flex-wrap: wrap;
  }

  .admin :global(.admin-row-main) {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 160px;
  }

  .admin :global(.admin-row-title) {
    font-size: 0.875rem;
    font-weight: 600;
    color: #1a1a1a;
    overflow-wrap: anywhere;
  }

  .admin :global(.admin-row-meta) {
    font-size: 0.75rem;
    color: #888;
  }

  .admin :global(.admin-row-actions) {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .admin :global(.admin-badge) {
    font-size: 0.65rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 2px 6px;
    border-radius: 999px;
    background: #f0ece6;
    color: #6b665f;
    margin-left: 6px;
  }

  .admin :global(.admin-badge.warn) {
    background: #fdf0e8;
    color: #c4561a;
  }

  .admin :global(.admin-link) {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .admin :global(.admin-link input) {
    flex: 1;
    min-width: 0;
  }

  .admin :global(.admin-divider) {
    height: 1px;
    background: #f0f0f0;
  }
</style>
