<script lang="ts">
  import { onMount } from 'svelte'
  import Button from '$src/components/common/buttons/Button.svelte'
  import { adminService } from '$src/services/AdminService'
  import type { InstanceSettings, UpdateStatus } from '$src/interfaces/Admin'
  import { formatTimestamp } from '$src/utils/DateUtils'

  let saved = $state<InstanceSettings | null>(null)
  let draft = $state<InstanceSettings | null>(null)
  let update = $state<UpdateStatus | null>(null)
  let saving = $state(false)
  let mailMessage = $state('')

  const changed = $derived(
    saved !== null && draft !== null && JSON.stringify(saved) !== JSON.stringify(draft)
  )

  onMount(async () => {
    const [settings, status] = await Promise.all([
      adminService.settings(),
      adminService.updateStatus().catch(() => null)
    ])
    saved = settings
    draft = { ...settings }
    update = status
  })

  async function save(): Promise<void> {
    if (!draft) return
    saving = true
    try {
      saved = await adminService.updateSettings({
        instanceName: draft.instanceName.trim(),
        registrationMode: draft.registrationMode,
        marginCreationPolicy: draft.marginCreationPolicy,
        requireEmailVerification: draft.requireEmailVerification,
        requireAccountApproval: draft.requireAccountApproval,
        maxCallParticipants: Math.max(0, Math.floor(Number(draft.maxCallParticipants) || 0))
      })
      draft = { ...saved }
    } finally {
      saving = false
    }
  }

  async function sendTestMail(): Promise<void> {
    mailMessage = 'Sending…'
    try {
      await adminService.sendTestMail()
      mailMessage = 'Sent. Check your inbox.'
    } catch {
      mailMessage = 'Sending failed. Check the SMTP settings in .env and the server log.'
    }
  }
</script>

{#if draft}
  <section class="admin-section">
    <h3 class="admin-section-title">Instance</h3>

    <label class="admin-field">
      <span class="admin-label">Name</span>
      <input class="admin-input" bind:value={draft.instanceName} maxlength="80" />
    </label>

    <label class="admin-field">
      <span class="admin-label">Who can sign up</span>
      <select class="admin-select" bind:value={draft.registrationMode}>
        <option value="INVITE">People with an invite code or margin invite link</option>
        <option value="OPEN">Anyone who can reach this instance</option>
        <option value="CLOSED">Nobody: admins create accounts</option>
      </select>
    </label>

    <label class="admin-field">
      <span class="admin-label">Who can create margins</span>
      <select class="admin-select" bind:value={draft.marginCreationPolicy}>
        <option value="EVERYONE">Everyone</option>
        <option value="ADMINS_ONLY">Admins only</option>
      </select>
    </label>

    <label class="admin-check">
      <input type="checkbox" bind:checked={draft.requireAccountApproval} />
      New accounts need an admin's approval
    </label>

    <label class="admin-check">
      <input
        type="checkbox"
        bind:checked={draft.requireEmailVerification}
        disabled={!draft.mailEnabled}
      />
      New accounts must confirm their email
    </label>
    {#if !draft.mailEnabled}
      <p class="admin-hint">Email confirmation needs SMTP, which isn't set up.</p>
    {/if}

    <label class="admin-field">
      <span class="admin-label">Max call participants</span>
      <input
        class="admin-input"
        type="number"
        min="0"
        step="1"
        bind:value={draft.maxCallParticipants}
      />
      <span class="admin-hint">Applies to channel calls and meetings. 0 means unlimited.</span>
    </label>

    <div>
      <Button
        buttonType="primary"
        size="small"
        text={saving ? 'Saving…' : 'Save changes'}
        disabled={!changed || saving}
        onClick={save}
      />
    </div>
  </section>

  <div class="admin-divider"></div>

  <section class="admin-section">
    <h3 class="admin-section-title">Email</h3>
    {#if draft.mailEnabled}
      <p class="admin-hint">SMTP is set up. Send yourself a test email to check it works.</p>
      <div>
        <Button buttonType="secondary" size="small" text="Send test email" onClick={sendTestMail} />
      </div>
      {#if mailMessage}
        <p class="admin-hint">{mailMessage}</p>
      {/if}
    {:else}
      <p class="admin-hint">
        No SMTP server is set up, so this instance sends no email. Password resets go through you
        (Users → Reset link), and meeting invites are shared as links. Set the SMTP_* values in .env
        to turn mail on.
      </p>
    {/if}
  </section>

  <div class="admin-divider"></div>

  <section class="admin-section">
    <h3 class="admin-section-title">Updates</h3>
    {#if !update}
      <p class="admin-hint">Update status is unavailable.</p>
    {:else if !update.enabled}
      <p class="admin-hint">
        Running {update.currentVersion}. The daily update check is off (UPDATE_CHECK=false).
      </p>
    {:else if update.updateAvailable}
      <p class="admin-hint">
        Running {update.currentVersion}. Version {update.latestVersion} is available.
        {#if update.releaseUrl}
          <a href={update.releaseUrl} target="_blank" rel="noopener noreferrer">Release notes</a>
        {/if}
      </p>
    {:else if !update.latestVersion}
      <p class="admin-hint">
        Running {update.currentVersion}. The instance hasn't checked for updates yet.
      </p>
    {:else}
      <p class="admin-hint">
        Running {update.currentVersion}, the latest release.
        {#if update.checkedAt}Last checked {formatTimestamp(update.checkedAt)}.{/if}
      </p>
    {/if}
  </section>
{:else}
  <p class="admin-hint">Loading…</p>
{/if}
