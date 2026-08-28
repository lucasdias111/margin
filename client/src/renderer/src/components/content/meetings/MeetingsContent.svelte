<script lang="ts">
  import { onMount } from 'svelte'
  import { push } from 'svelte-spa-router'
  import { meetingService } from '$src/services/MeetingService'
  import { formatMeetingWhen } from '$src/utils/DateUtils'
  import ScheduleMeetingModal from '$src/components/content/meetings/ScheduleMeetingModal.svelte'
  import MeetingDetailPanel from '$src/components/content/meetings/MeetingDetailPanel.svelte'
  import StartMeetingModal from '$src/components/content/call/StartMeetingModal.svelte'
  import type { MeetingSummary } from '$src/interfaces/Meetings'

  let meetings = $state<MeetingSummary[]>([])
  let selected = $state<MeetingSummary | null>(null)
  let showSchedule = $state(false)
  let showStartNow = $state(false)
  let editing = $state<MeetingSummary | null>(null)
  let loading = $state(true)

  const upcoming = $derived(
    meetings
      .filter((m) => m.status === 'SCHEDULED' || m.status === 'LIVE')
      .sort((a, b) => (a.scheduledAt ?? '').localeCompare(b.scheduledAt ?? ''))
  )

  const past = $derived(meetings.filter((m) => m.status === 'ENDED' || m.status === 'CANCELLED'))

  onMount(refresh)

  async function refresh(): Promise<void> {
    meetings = await meetingService.myMeetings()
    loading = false
    if (selected) {
      selected = meetings.find((m) => m.code === selected!.code) ?? null
    }
  }
</script>

<div class="meetings">
  <div class="meetings-header">
    <h1 class="meetings-title">Meetings</h1>
    <div class="header-actions">
      <button class="secondary-btn" onclick={() => (showStartNow = true)}>Start now</button>
      <button class="plan-btn" onclick={() => (showSchedule = true)}>Plan meeting</button>
    </div>
  </div>

  <div class="meetings-body">
    <div class="meetings-list">
      {#if loading}
        <p class="muted">Loading…</p>
      {:else if meetings.length === 0}
        <p class="muted">
          Nothing planned. Start a meeting now, or plan one and invite people by email.
        </p>
      {:else}
        {#if upcoming.length > 0}
          <p class="section-label">Upcoming</p>
          {#each upcoming as meeting (meeting.code)}
            <button
              class="row"
              class:active={selected?.code === meeting.code}
              onclick={() => (selected = meeting)}
            >
              <span class="row-title">{meeting.title ?? 'Meeting'}</span>
              <span class="row-when">
                {meeting.scheduledAt
                  ? formatMeetingWhen(meeting.scheduledAt, meeting.organizerTimezone)
                  : 'In progress'}
              </span>
            </button>
          {/each}
        {/if}

        {#if past.length > 0}
          <p class="section-label">Past</p>
          {#each past as meeting (meeting.code)}
            <button
              class="row past"
              class:active={selected?.code === meeting.code}
              onclick={() => (selected = meeting)}
            >
              <span class="row-title">{meeting.title ?? 'Meeting'}</span>
              <span class="row-when">
                {meeting.status === 'CANCELLED' ? 'Cancelled' : 'Ended'}
              </span>
            </button>
          {/each}
        {/if}
      {/if}
    </div>

    {#if selected}
      <div class="meetings-detail">
        <MeetingDetailPanel
          meeting={selected}
          onEdit={() => (editing = selected)}
          onChanged={refresh}
          onClose={() => (selected = null)}
        />
      </div>
    {/if}
  </div>
</div>

{#if showSchedule}
  <ScheduleMeetingModal
    onClose={() => (showSchedule = false)}
    onSaved={() => {
      showSchedule = false
      refresh()
    }}
  />
{/if}

{#if editing}
  <ScheduleMeetingModal
    existing={editing}
    onClose={() => (editing = null)}
    onSaved={() => {
      editing = null
      refresh()
    }}
  />
{/if}

{#if showStartNow}
  <StartMeetingModal
    onClose={() => (showStartNow = false)}
    onStarted={(code) => {
      showStartNow = false
      push(`/meet/${code}`)
    }}
  />
{/if}

<style>
  .meetings {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 24px;
    gap: 16px;
    overflow: hidden;
  }

  .meetings-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .meetings-title {
    margin: 0;
    font-size: 20px;
  }

  .header-actions {
    display: flex;
    gap: 8px;
  }

  .meetings-body {
    display: flex;
    gap: 20px;
    flex: 1;
    min-height: 0;
  }

  .meetings-list {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
    overflow-y: auto;
  }

  .meetings-detail {
    width: 320px;
    flex-shrink: 0;
  }

  .section-label {
    margin: 12px 0 4px;
    font-size: 12px;
    opacity: 0.6;
  }

  .muted {
    margin: 0;
    font-size: 13px;
    opacity: 0.75;
  }

  .row {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    padding: 10px 12px;
    border: 1px solid transparent;
    border-radius: 8px;
    background: white;
    cursor: pointer;
    text-align: left;
    width: 100%;
  }

  .row.active {
    border-color: #f47e3a;
  }

  .row.past {
    opacity: 0.65;
  }

  .row-title {
    font-size: 14px;
    font-weight: 600;
  }

  .row-when {
    font-size: 12px;
    opacity: 0.7;
  }

  .plan-btn {
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    background-color: #f47e3a;
    color: white;
    font-size: 14px;
    cursor: pointer;
  }

  .secondary-btn {
    padding: 8px 14px;
    border: 1px solid rgba(0, 0, 0, 0.15);
    border-radius: 6px;
    background: transparent;
    font-size: 14px;
    cursor: pointer;
  }
</style>
