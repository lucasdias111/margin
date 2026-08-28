import { meetingService } from '$src/services/MeetingService'
import type { MeetingSummary } from '$src/interfaces/Meetings'

class MeetingsState {
  meetings = $state<MeetingSummary[]>([])
  selectedCode = $state<string | null>(null)
  loading = $state(true)
  private inFlight: Promise<void> | null = null

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

  /**
   * Owned here rather than by a component so the sidebar and the calendar do not depend on each
   * other's lifecycle, and so two mounts in the same tick share one request.
   */
  async load(): Promise<void> {
    if (this.inFlight) return this.inFlight

    this.inFlight = meetingService
      .myMeetings()
      .then((meetings) => this.setMeetings(meetings))
      .finally(() => {
        this.loading = false
        this.inFlight = null
      })

    return this.inFlight
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
    this.inFlight = null
  }
}

export const meetingsState = new MeetingsState()
