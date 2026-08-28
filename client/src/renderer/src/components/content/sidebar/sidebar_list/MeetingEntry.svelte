<script lang="ts">
  import Icon from '$src/components/common/icons/Icon.svelte'
  import { meetingsState } from '$src/states/MeetingsState.svelte'
  import { formatMeetingWhen } from '$src/utils/DateUtils'
  import { pressable } from '$src/animations'
  import type { MeetingSummary } from '$src/interfaces/Meetings'

  interface Props {
    meeting: MeetingSummary
    active: boolean
  }

  let { meeting, active }: Props = $props()

  const isLive = $derived(meeting.status === 'LIVE')

  const subtitle = $derived(
    meeting.status === 'CANCELLED'
      ? 'Cancelled'
      : meeting.status === 'ENDED'
        ? 'Ended'
        : meeting.scheduledAt
          ? formatMeetingWhen(meeting.scheduledAt, meeting.organizerTimezone)
          : 'In progress'
  )
</script>

<button
  class="meeting-button"
  class:active
  onclick={() => meetingsState.select(meeting.code)}
  use:pressable={{ scale: 0.98 }}
>
  <span class="meeting-type-icon">
    <Icon name="calendar" size={14} />
  </span>
  <span class="meeting-info">
    <span class="meeting-name">{meeting.title ?? 'Meeting'}</span>
    <span class="meeting-meta">{subtitle}</span>
  </span>
  {#if isLive}
    <span class="live-dot"></span>
  {/if}
</button>

<style>
  .meeting-button {
    position: relative;
    width: 100%;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    background: none;
    border: none;
    border-radius: 8px;
    font-size: 13px;
    color: #77776f;
    cursor: pointer;
    text-align: left;
    transition:
      background var(--motion-fast) var(--ease-standard),
      color var(--motion-fast) var(--ease-standard);
  }

  .meeting-button:hover {
    background: rgba(0, 0, 0, 0.045);
    color: #2a2a2a;
  }

  .meeting-button.active {
    background: rgba(228, 113, 42, 0.1);
    color: #ff843c;
    font-weight: 600;
  }

  .meeting-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .meeting-name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .meeting-meta {
    font-size: 11px;
    color: #b8b8b4;
    font-weight: 400;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .meeting-type-icon {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    color: #b4b4ae;
    transition: color var(--motion-fast) var(--ease-standard);
  }

  .meeting-button:hover .meeting-type-icon,
  .meeting-button.active .meeting-type-icon {
    color: inherit;
  }

  .live-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #3dd68c;
    flex-shrink: 0;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.4;
    }
  }
</style>
