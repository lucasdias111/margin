<script lang="ts">
  import { viewerTimeZone } from '$src/utils/DateUtils'
  import type { MeetingSummary } from '$src/interfaces/Meetings'
  import Button from '$src/components/common/buttons/Button.svelte'
  import { DURATION, EASING, listItemIn, listItemOut, viewIn } from '$src/animations'
  import { flip } from 'svelte/animate'

  const {
    meetings,
    selectedCode,
    onSelect
  }: {
    meetings: MeetingSummary[]
    selectedCode: string | null
    onSelect: (meeting: MeetingSummary) => void
  } = $props()

  const zone = viewerTimeZone()
  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  let cursorYear = $state(new Date().getFullYear())
  let cursorMonth = $state(new Date().getMonth())

  const monthLabel = $derived(
    new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(
      new Date(cursorYear, cursorMonth, 1)
    )
  )

  const cells = $derived.by(() => {
    const first = new Date(cursorYear, cursorMonth, 1)
    const offset = (first.getDay() + 6) % 7
    const todayKey = dayKey(new Date())

    return Array.from({ length: 42 }, (_, i) => {
      const date = new Date(cursorYear, cursorMonth, 1 - offset + i)
      return {
        key: dayKey(date),
        day: date.getDate(),
        inMonth: date.getMonth() === cursorMonth,
        today: dayKey(date) === todayKey,
        meetings: meetings.filter(
          (m) => m.scheduledAt !== null && dayKey(new Date(m.scheduledAt)) === dayKey(date)
        )
      }
    })
  })

  function dayKey(date: Date): string {
    return new Intl.DateTimeFormat('en-CA', { timeZone: zone }).format(date)
  }

  function timeOf(meeting: MeetingSummary): string {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: zone,
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(meeting.scheduledAt!))
  }

  function step(months: number): void {
    const moved = new Date(cursorYear, cursorMonth + months, 1)
    cursorYear = moved.getFullYear()
    cursorMonth = moved.getMonth()
  }

  function goToToday(): void {
    const now = new Date()
    cursorYear = now.getFullYear()
    cursorMonth = now.getMonth()
  }
</script>

<div class="calendar">
  <div class="calendar-header">
    <Button buttonType="secondary" size="small" text="‹" onClick={() => step(-1)} />
    <span class="month-label">{monthLabel}</span>
    <Button buttonType="secondary" size="small" text="›" onClick={() => step(1)} />
    <Button buttonType="secondary" size="small" text="Today" onClick={goToToday} />
  </div>

  <div class="weekday-row">
    {#each weekdays as day (day)}
      <span class="weekday">{day}</span>
    {/each}
  </div>

  {#key `${cursorYear}-${cursorMonth}`}
    <div class="grid" in:viewIn>
      {#each cells as cell (cell.key)}
        <div class="cell" class:outside={!cell.inMonth} class:today={cell.today}>
          <span class="day-number">{cell.day}</span>
          {#each cell.meetings as meeting (meeting.code)}
            <button
              class="chip"
              class:selected={selectedCode === meeting.code}
              class:cancelled={meeting.status === 'CANCELLED'}
              onclick={() => onSelect(meeting)}
              title={meeting.title ?? 'Meeting'}
              animate:flip={{ duration: DURATION.base, easing: EASING.standard }}
              in:listItemIn
              out:listItemOut
            >
              <span class="chip-time">{timeOf(meeting)}</span>
              <span class="chip-title">{meeting.title ?? 'Meeting'}</span>
            </button>
          {/each}
        </div>
      {/each}
    </div>
  {/key}
</div>

<style>
  .calendar {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    color: #2d2d2d;
  }

  .calendar-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
  }

  .month-label {
    font-size: 15px;
    font-weight: 600;
    min-width: 160px;
    text-align: center;
  }

  .weekday-row {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
    margin-bottom: 4px;
  }

  .weekday {
    font-size: 11px;
    opacity: 0.6;
    text-align: center;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    grid-auto-rows: minmax(72px, 1fr);
    gap: 4px;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }

  .cell {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 4px;
    border-radius: 8px;
    background: white;
    border: 1px solid transparent;
    overflow: hidden;
  }

  .cell.outside {
    opacity: 0.4;
  }

  .cell.today {
    border-color: #ff843c;
  }

  .day-number {
    font-size: 11px;
    opacity: 0.7;
  }

  .chip {
    color: #2d2d2d;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 1px;
    padding: 3px 5px;
    border: none;
    border-radius: 5px;
    background: rgba(255, 132, 60, 0.14);
    cursor: pointer;
    text-align: left;
    width: 100%;
    overflow: hidden;
  }

  .chip.selected {
    background: #ff843c;
    color: white;
  }

  .chip.cancelled {
    background: rgba(0, 0, 0, 0.07);
    text-decoration: line-through;
    opacity: 0.7;
  }

  .chip-time {
    font-size: 10px;
    font-weight: 600;
  }

  .chip-title {
    font-size: 11px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }
</style>
