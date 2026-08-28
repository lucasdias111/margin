import type { MeetingSummary } from '$src/interfaces/Meetings'

class MeetingsState {
  meetings = $state<MeetingSummary[]>([])
  selectedCode = $state<string | null>(null)
  loading = $state(true)

  get upcoming(): MeetingSummary[] {
    return this.meetings
      .filter((m) => m.status === 'SCHEDULED' || m.status === 'LIVE')
      .sort((a, b) => (a.scheduledAt ?? '').localeCompare(b.scheduledAt ?? ''))
  }

  get past(): MeetingSummary[] {
    return this.meetings.filter((m) => m.status === 'ENDED' || m.status === 'CANCELLED')
  }

  get selected(): MeetingSummary | null {
    return this.meetings.find((m) => m.code === this.selectedCode) ?? null
  }

  setMeetings(meetings: MeetingSummary[]): void {
    this.meetings = meetings
    if (this.selectedCode && !meetings.some((m) => m.code === this.selectedCode)) {
      this.selectedCode = null
    }
  }

  select(code: string | null): void {
    this.selectedCode = code
  }

  reset(): void {
    this.meetings = []
    this.selectedCode = null
    this.loading = true
  }
}

export const meetingsState = new MeetingsState()
