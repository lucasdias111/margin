<script lang="ts">
  import { meetingsState } from '$src/states/MeetingsState.svelte'
  import { formatMeetingWhen } from '$src/utils/DateUtils'
</script>

<div class="meetings-list">
  <p class="list-label">Upcoming</p>

  {#if meetingsState.loading}
    <p class="muted">Loading…</p>
  {:else if meetingsState.upcoming.length === 0}
    <p class="muted">Nothing planned yet.</p>
  {:else}
    {#each meetingsState.upcoming as meeting (meeting.code)}
      <button
        class="entry"
        class:active={meetingsState.selectedCode === meeting.code}
        onclick={() => meetingsState.select(meeting.code)}
      >
        <span class="entry-title">{meeting.title ?? 'Meeting'}</span>
        <span class="entry-when">
          {meeting.scheduledAt
            ? formatMeetingWhen(meeting.scheduledAt, meeting.organizerTimezone)
            : 'In progress'}
        </span>
      </button>
    {/each}
  {/if}

  {#if meetingsState.past.length > 0}
    <p class="list-label">Past</p>
    {#each meetingsState.past as meeting (meeting.code)}
      <button
        class="entry past"
        class:active={meetingsState.selectedCode === meeting.code}
        onclick={() => meetingsState.select(meeting.code)}
      >
        <span class="entry-title">{meeting.title ?? 'Meeting'}</span>
        <span class="entry-when">
          {meeting.status === 'CANCELLED' ? 'Cancelled' : 'Ended'}
        </span>
      </button>
    {/each}
  {/if}
</div>

<style>
  .meetings-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
    overflow-y: auto;
    color: #2d2d2d;
  }

  .list-label {
    margin: 10px 0 2px;
    font-size: 12px;
    opacity: 0.6;
  }

  .muted {
    margin: 0;
    font-size: 13px;
    opacity: 0.7;
  }

  .entry {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    padding: 8px 10px;
    border: 1px solid transparent;
    border-radius: 8px;
    background: transparent;
    cursor: pointer;
    text-align: left;
    width: 100%;
    color: inherit;
  }

  .entry:hover {
    background: rgba(0, 0, 0, 0.04);
  }

  .entry.active {
    background: rgba(255, 132, 60, 0.12);
    border-color: rgba(255, 132, 60, 0.5);
  }

  .entry.past {
    opacity: 0.6;
  }

  .entry-title {
    font-size: 14px;
    font-weight: 600;
  }

  .entry-when {
    font-size: 12px;
    opacity: 0.7;
  }
</style>
