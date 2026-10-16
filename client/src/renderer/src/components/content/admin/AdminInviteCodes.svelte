<script lang="ts">
  import { onMount } from 'svelte'
  import Button from '$src/components/common/buttons/Button.svelte'
  import CopyLink from '$src/components/content/admin/CopyLink.svelte'
  import { adminService } from '$src/services/AdminService'
  import { instanceService } from '$src/services/InstanceService'
  import { instanceState } from '$src/states/InstanceState.svelte'
  import type { InviteCode } from '$src/interfaces/Admin'
  import { formatTimestamp } from '$src/utils/DateUtils'

  const EXPIRY_OPTIONS = [
    { label: 'Never', days: 0 },
    { label: '1 day', days: 1 },
    { label: '7 days', days: 7 },
    { label: '30 days', days: 30 }
  ]

  let codes = $state<InviteCode[]>([])
  let loaded = $state(false)
  let maxUses = $state<number | null>(1)
  let expiryDays = $state(7)
  let newest = $state<InviteCode | null>(null)

  const usable = $derived(codes.filter((c) => c.usable))
  const spent = $derived(codes.filter((c) => !c.usable))

  onMount(refresh)

  async function refresh(): Promise<void> {
    codes = await adminService.inviteCodes()
    loaded = true
  }

  // A sign-up link carrying the code, so people don't have to type it.
  function signUpLink(code: InviteCode): string {
    return instanceService.publicLink(`/register?invite=${encodeURIComponent(code.code)}`)
  }

  async function create(): Promise<void> {
    const expiresAt =
      expiryDays > 0 ? new Date(Date.now() + expiryDays * 86_400_000).toISOString() : null
    const uses = maxUses && maxUses > 0 ? Math.floor(maxUses) : null
    newest = await adminService.createInviteCode(uses, expiresAt)
    await refresh()
  }

  async function revoke(code: InviteCode): Promise<void> {
    await adminService.revokeInviteCode(code.id)
    if (newest?.id === code.id) newest = null
    await refresh()
  }

  function describe(code: InviteCode): string {
    const uses = code.maxUses ? `${code.useCount} of ${code.maxUses} uses` : `${code.useCount} uses`
    const expiry = code.expiresAt ? ` · expires ${formatTimestamp(code.expiresAt)}` : ''
    return uses + expiry
  }
</script>

{#if instanceState.info?.registrationMode !== 'INVITE'}
  <p class="admin-hint">
    Invite codes only matter while sign-up is set to invite-only (General → Who can sign up).
  </p>
{/if}

<section class="admin-section">
  <h3 class="admin-section-title">New invite code</h3>
  <div class="create-row">
    <label class="admin-field">
      <span class="admin-label">Uses</span>
      <input
        class="admin-input"
        type="number"
        min="0"
        placeholder="Unlimited"
        bind:value={maxUses}
      />
    </label>
    <label class="admin-field">
      <span class="admin-label">Expires after</span>
      <select class="admin-select" bind:value={expiryDays}>
        {#each EXPIRY_OPTIONS as option (option.days)}
          <option value={option.days}>{option.label}</option>
        {/each}
      </select>
    </label>
    <Button buttonType="primary" size="small" text="Create code" onClick={create} />
  </div>
  {#if newest}
    <span class="admin-label">Sign-up link for code {newest.code}</span>
    <CopyLink link={signUpLink(newest)} onDismiss={() => (newest = null)} />
  {/if}
</section>

<section class="admin-section">
  <h3 class="admin-section-title">Active codes</h3>
  {#if !loaded}
    <p class="admin-hint">Loading…</p>
  {/if}
  {#each usable as code (code.id)}
    <div class="admin-row">
      <div class="admin-row-main">
        <span class="admin-row-title">{code.code}</span>
        <span class="admin-row-meta">{describe(code)}</span>
      </div>
      <div class="admin-row-actions">
        <Button
          buttonType="secondary"
          size="small"
          text="Show link"
          onClick={() => (newest = code)}
        />
        <Button buttonType="delete" size="small" text="Revoke" onClick={() => revoke(code)} />
      </div>
    </div>
  {:else}
    {#if loaded}<p class="admin-hint">No active codes.</p>{/if}
  {/each}
</section>

{#if spent.length > 0}
  <section class="admin-section">
    <h3 class="admin-section-title">Used up, expired or revoked</h3>
    {#each spent as code (code.id)}
      <div class="admin-row">
        <div class="admin-row-main">
          <span class="admin-row-title">
            {code.code}
            {#if code.revoked}<span class="admin-badge">Revoked</span>{/if}
          </span>
          <span class="admin-row-meta">{describe(code)}</span>
        </div>
      </div>
    {/each}
  </section>
{/if}

<style>
  .create-row {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    align-items: flex-end;
  }
</style>
