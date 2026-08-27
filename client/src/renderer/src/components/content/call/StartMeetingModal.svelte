<script lang="ts">
  import { onMount } from 'svelte'
  import { meetingService } from '$src/services/MeetingService'
  import type { EligibleMargin } from '$src/interfaces/Meetings'

  const { onClose, onStarted }: { onClose: () => void; onStarted: (code: string) => void } =
    $props()

  let margins = $state<EligibleMargin[]>([])
  let selectedMarginId = $state<number | null>(null)
  let title = $state('')
  let loading = $state(true)
  let starting = $state(false)

  onMount(async () => {
    margins = await meetingService.loadEligibleMargins()
    if (margins.length > 0) selectedMarginId = margins[0].marginId
    loading = false
  })

  async function start(): Promise<void> {
    if (selectedMarginId === null || starting) return
    starting = true
    const meeting = await meetingService.createMeeting(selectedMarginId, title.trim() || null)
    starting = false
    if (meeting) onStarted(meeting.code)
  }
</script>

<div class="backdrop" role="presentation" onclick={onClose}>
  <div class="modal" role="dialog" onclick={(e) => e.stopPropagation()}>
    {#if loading}
      <p class="hint">Loading…</p>
    {:else if margins.length === 0}
      <h2 class="modal-title">Meetings are a paid feature</h2>
      <p class="hint">
        Upgrade a margin you belong to to start meetings and invite people from outside Margin.
      </p>
      <button class="primary-btn" onclick={onClose}>Got it</button>
    {:else}
      <h2 class="modal-title">Start a meeting</h2>

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

      <label class="field">
        <span class="field-label">Title (optional)</span>
        <input type="text" bind:value={title} placeholder="Weekly sync" maxlength="120" />
      </label>

      <div class="actions">
        <button class="secondary-btn" onclick={onClose}>Cancel</button>
        <button class="primary-btn" onclick={start} disabled={starting}>
          {starting ? 'Starting…' : 'Start meeting'}
        </button>
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
    background: #f2eee8;
    border-radius: 10px;
    padding: 24px;
    width: 360px;
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

  .primary-btn {
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    background-color: #f47e3a;
    color: white;
    cursor: pointer;
    font-size: 14px;
  }

  .primary-btn:disabled {
    opacity: 0.6;
    cursor: default;
  }

  .secondary-btn {
    padding: 8px 16px;
    border: 1px solid rgba(0, 0, 0, 0.15);
    border-radius: 6px;
    background: transparent;
    cursor: pointer;
    font-size: 14px;
  }
</style>
