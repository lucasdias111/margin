<script lang="ts">
  import { onMount } from 'svelte'
  import { meetingService } from '$src/services/MeetingService'
  import { viewerTimeZone, toLocalInputValue } from '$src/utils/DateUtils'
  import Button from '$src/components/common/buttons/Button.svelte'
  import type { EligibleMargin, MeetingSummary } from '$src/interfaces/Meetings'

  const {
    existing = null,
    onClose,
    onSaved
  }: {
    existing?: MeetingSummary | null
    onClose: () => void
    onSaved: (meeting: MeetingSummary) => void
  } = $props()

  const isEdit = $derived(existing !== null)

  let margins = $state<EligibleMargin[]>([])
  let selectedMarginId = $state<number | null>(null)
  let title = $state(existing?.title ?? '')
  let localWhen = $state(
    existing?.scheduledAt
      ? toLocalInputValue(existing.scheduledAt)
      : toLocalInputValue(new Date(Date.now() + 60 * 60 * 1000))
  )
  let duration = $state(existing?.durationMinutes ?? 30)
  let inviteeEmails = $state('')
  let loading = $state(true)
  let saving = $state(false)
  let error = $state('')

  const zone = viewerTimeZone()

  onMount(async () => {
    if (!isEdit) {
      margins = await meetingService.loadEligibleMargins()
      if (margins.length > 0) selectedMarginId = margins[0].marginId
    }
    loading = false
  })

  async function save(): Promise<void> {
    if (saving) return
    error = ''

    const when = new Date(localWhen)
    if (Number.isNaN(when.getTime())) {
      error = 'Pick a date and time.'
      return
    }
    if (when.getTime() <= Date.now()) {
      error = 'Pick a time in the future.'
      return
    }

    saving = true
    const saved = isEdit
      ? await meetingService.reschedule(
          existing!.code,
          when.toISOString(),
          duration,
          title.trim() || null
        )
      : await meetingService.schedule({
          marginId: selectedMarginId!,
          title: title.trim() || null,
          scheduledAt: when.toISOString(),
          durationMinutes: duration,
          organizerTimezone: zone,
          invitees: parseInvitees()
        })
    saving = false

    if (!saved) {
      error = 'That did not save. Try again in a moment.'
      return
    }
    onSaved(saved)
  }

  function parseInvitees(): { userId: number | null; email: string | null }[] {
    return inviteeEmails
      .split(/[\s,;]+/)
      .map((e) => e.trim())
      .filter((e) => e.length > 0)
      .map((email) => ({ userId: null, email }))
  }
</script>

<div class="backdrop" role="presentation" onclick={onClose}>
  <div class="modal" role="dialog" onclick={(e) => e.stopPropagation()}>
    {#if loading}
      <p class="hint">Loading…</p>
    {:else if !isEdit && margins.length === 0}
      <h2 class="modal-title">Meetings are a paid feature</h2>
      <p class="hint">Upgrade a margin you belong to to plan meetings.</p>
      <Button buttonType="primary" size="medium" text="Got it" onClick={onClose} />
    {:else}
      <h2 class="modal-title">{isEdit ? 'Move meeting' : 'Plan a meeting'}</h2>

      {#if !isEdit}
        {#if margins.length > 1}
          <label class="field">
            <span class="field-label">On behalf of</span>
            <select bind:value={selectedMarginId}>
              {#each margins as margin (margin.marginId)}
                <option value={margin.marginId}>{margin.marginName}</option>
              {/each}
            </select>
          </label>
        {:else}
          <p class="hint">On behalf of <strong>{margins[0].marginName}</strong></p>
        {/if}
      {/if}

      <label class="field">
        <span class="field-label">Title</span>
        <input type="text" bind:value={title} placeholder="Weekly sync" maxlength="120" />
      </label>

      <label class="field">
        <span class="field-label">When ({zone})</span>
        <input type="datetime-local" bind:value={localWhen} />
      </label>

      <label class="field">
        <span class="field-label">Length</span>
        <select bind:value={duration}>
          <option value={15}>15 minutes</option>
          <option value={30}>30 minutes</option>
          <option value={45}>45 minutes</option>
          <option value={60}>1 hour</option>
          <option value={90}>1.5 hours</option>
        </select>
      </label>

      {#if !isEdit}
        <label class="field">
          <span class="field-label">Invite by email</span>
          <input
            type="text"
            bind:value={inviteeEmails}
            placeholder="a@example.com, b@example.com"
          />
        </label>
      {/if}

      {#if error}
        <p class="error">{error}</p>
      {/if}

      <div class="actions">
        <Button buttonType="secondary" size="medium" text="Cancel" onClick={onClose} />
        <Button
          buttonType="primary"
          size="medium"
          disabled={saving}
          text={saving ? 'Saving…' : isEdit ? 'Move meeting' : 'Plan meeting'}
          onClick={save}
        />
      </div>
    {/if}
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.35);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }

  .modal {
    color: #2d2d2d;
    background: #f2eee8;
    border-radius: 10px;
    padding: 24px;
    width: 380px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .modal-title {
    margin: 0;
    font-size: 18px;
  }

  .hint {
    margin: 0;
    font-size: 13px;
    opacity: 0.75;
  }

  .error {
    margin: 0;
    font-size: 13px;
    color: #c0392b;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .field-label {
    font-size: 12px;
    opacity: 0.75;
  }

  .field input,
  .field select {
    padding: 8px;
    border: 1px solid rgba(0, 0, 0, 0.15);
    border-radius: 6px;
    font-size: 14px;
    background: white;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
</style>
