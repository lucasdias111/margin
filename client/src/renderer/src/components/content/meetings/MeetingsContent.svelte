<script lang="ts">
  import { onMount } from 'svelte'
  import { push } from 'svelte-spa-router'
  import { meetingService } from '$src/services/MeetingService'
  import ScheduleMeetingModal from '$src/components/content/meetings/ScheduleMeetingModal.svelte'
  import MeetingDetailPanel from '$src/components/content/meetings/MeetingDetailPanel.svelte'
  import MeetingCalendar from '$src/components/content/meetings/MeetingCalendar.svelte'
  import StartMeetingModal from '$src/components/content/call/StartMeetingModal.svelte'
  import Button from '$src/components/common/buttons/Button.svelte'
  import { meetingsState } from '$src/states/MeetingsState.svelte'
  import type { MeetingSummary } from '$src/interfaces/Meetings'

  let showSchedule = $state(false)
  let showStartNow = $state(false)
  let editing = $state<MeetingSummary | null>(null)

  onMount(refresh)

  async function refresh(): Promise<void> {
    meetingsState.setMeetings(await meetingService.myMeetings())
    meetingsState.loading = false
  }
</script>

<div class="meetings">
  <div class="meetings-header">
    <h1 class="meetings-title">Meetings</h1>
    <div class="header-actions">
      <Button
        buttonType="secondary"
        size="medium"
        text="Start now"
        onClick={() => (showStartNow = true)}
      />
      <Button
        buttonType="primary"
        size="medium"
        text="Plan meeting"
        onClick={() => (showSchedule = true)}
      />
    </div>
  </div>

  <div class="meetings-body">
    <div class="calendar-pane">
      <MeetingCalendar
        meetings={meetingsState.meetings}
        selectedCode={meetingsState.selectedCode}
        onSelect={(meeting) => meetingsState.select(meeting.code)}
      />
    </div>
  </div>
</div>

{#if meetingsState.selected}
  <MeetingDetailPanel
    meeting={meetingsState.selected}
    onEdit={() => (editing = meetingsState.selected)}
    onChanged={refresh}
    onClose={() => meetingsState.select(null)}
  />
{/if}

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
    color: #2d2d2d;
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 20px 20px 20px 0;
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

  .calendar-pane {
    flex: 1;
    min-width: 0;
    display: flex;
  }
</style>
