<script lang="ts">
  import { onMount } from 'svelte'
  import { push } from 'svelte-spa-router'
  import { meetingService } from '$src/services/MeetingService'
  import { sessionState } from '$src/states/SessionState.svelte'
  import { formatMeetingWhen } from '$src/utils/DateUtils'
  import type { MeetingInvitee, MeetingSummary } from '$src/interfaces/Meetings'

  const {
    meeting,
    onEdit,
    onChanged,
    onClose
  }: {
    meeting: MeetingSummary
    onEdit: () => void
    onChanged: () => void
    onClose: () => void
  } = $props()

  let invitees = $state<MeetingInvitee[]>([])
  let linkCopied = $state(false)

  const isHost = $derived(meeting.hostUserId === sessionState.currentUser?.id)
  const canJoin = $derived(meeting.status === 'SCHEDULED' || meeting.status === 'LIVE')

  onMount(async () => {
    invitees = await meetingService.invitees(meeting.code)
  })

  async function copyLink(): Promise<void> {
    await navigator.clipboard.writeText(meetingService.shareLink(meeting.code))
    linkCopied = true
    setTimeout(() => (linkCopied = false), 2000)
  }

  async function cancel(): Promise<void> {
    if (await meetingService.cancel(meeting.code)) onChanged()
  }
</script>

<div class="detail">
  <div class="detail-header">
    <h2 class="detail-title">{meeting.title ?? 'Meeting'}</h2>
    <button class="close-btn" onclick={onClose} aria-label="Close">×</button>
  </div>

  {#if meeting.scheduledAt}
    <p class="detail-when">
      {formatMeetingWhen(meeting.scheduledAt, meeting.organizerTimezone)}
    </p>
  {/if}

  <p class="detail-meta">
    {meeting.marginName}{meeting.durationMinutes ? ` · ${meeting.durationMinutes} min` : ''}
    {#if meeting.status === 'CANCELLED'}· Cancelled{/if}
    {#if meeting.status === 'ENDED'}· Ended{/if}
    {#if meeting.status === 'LIVE'}· In progress{/if}
  </p>

  {#if invitees.length > 0}
    <div class="invitee-list">
      <p class="section-label">Invited</p>
      {#each invitees as invitee (invitee.inviteId)}
        <div class="invitee-row">
          <span class="invitee-name">{invitee.displayName ?? invitee.email}</span>
          <span class="invitee-status">{invitee.status.toLowerCase()}</span>
        </div>
      {/each}
    </div>
  {/if}

  <div class="detail-actions">
    {#if canJoin}
      <button class="primary-btn" onclick={() => push(`/meet/${meeting.code}`)}>
        {isHost && meeting.status === 'SCHEDULED' ? 'Start' : 'Join'}
      </button>
    {/if}
    <button class="secondary-btn" onclick={copyLink}>
      {linkCopied ? 'Copied' : 'Copy link'}
    </button>
    {#if isHost && meeting.status === 'SCHEDULED'}
      <button class="secondary-btn" onclick={onEdit}>Edit</button>
      <button class="danger-btn" onclick={cancel}>Cancel meeting</button>
    {/if}
  </div>
</div>

<style>
  .detail {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 16px;
    background: white;
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 10px;
  }

  .detail-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
  }

  .detail-title {
    margin: 0;
    font-size: 17px;
  }

  .close-btn {
    border: none;
    background: transparent;
    font-size: 20px;
    cursor: pointer;
    line-height: 1;
  }

  .detail-when {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
  }

  .detail-meta,
  .section-label {
    margin: 0;
    font-size: 12px;
    opacity: 0.7;
  }

  .invitee-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .invitee-row {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
  }

  .invitee-status {
    opacity: 0.6;
  }

  .detail-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 4px;
  }

  .primary-btn {
    padding: 7px 16px;
    border: none;
    border-radius: 6px;
    background-color: #f47e3a;
    color: white;
    cursor: pointer;
    font-size: 13px;
  }

  .secondary-btn {
    padding: 7px 14px;
    border: 1px solid rgba(0, 0, 0, 0.15);
    border-radius: 6px;
    background: transparent;
    cursor: pointer;
    font-size: 13px;
  }

  .danger-btn {
    padding: 7px 14px;
    border: 1px solid rgba(192, 57, 43, 0.4);
    border-radius: 6px;
    background: transparent;
    color: #c0392b;
    cursor: pointer;
    font-size: 13px;
  }
</style>
