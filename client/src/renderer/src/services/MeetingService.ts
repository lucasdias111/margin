import { authenticatedGet, authenticatedPatch, authenticatedPost } from '$src/services/api'
import { webSocketService } from '$src/services/websocket/WebSocketService'
import { WebSocketMessageType } from '$src/interfaces/WebSocketMessageType'
import { toJoinResult } from '$src/utils/MeetingJoinFailure'
import type {
  EligibleMargin,
  Meeting,
  MeetingInvitee,
  MeetingJoinResult,
  MeetingSummary,
  ScheduleMeetingInput
} from '$src/interfaces/Meetings'

class MeetingService {
  async loadEligibleMargins(): Promise<EligibleMargin[]> {
    const response = await authenticatedGet('meetings/eligible-margins')
    if (!response.ok) return []
    return response.json()
  }

  async createMeeting(marginId: number, title: string | null): Promise<Meeting | null> {
    const response = await authenticatedPost({ marginId, title }, 'meetings')
    if (!response.ok) return null
    return response.json()
  }

  async getMeeting(code: string): Promise<Meeting | null> {
    const response = await authenticatedGet(`meetings/${code}`)
    if (!response.ok) return null
    return response.json()
  }

  async join(code: string): Promise<MeetingJoinResult> {
    return toJoinResult(await authenticatedPost(null, `meetings/${code}/join`))
  }

  async end(code: string): Promise<void> {
    await authenticatedPost(null, `meetings/${code}/end`)
  }

  invite(recipientId: number, code: string): void {
    webSocketService.send({
      type: WebSocketMessageType.MEETING_INVITE,
      recipientId,
      payload: code
    })
  }

  async myMeetings(): Promise<MeetingSummary[]> {
    const response = await authenticatedGet('meetings')
    if (!response.ok) return []
    return response.json()
  }

  async schedule(input: ScheduleMeetingInput): Promise<MeetingSummary | null> {
    const response = await authenticatedPost(input, 'meetings/schedule')
    if (!response.ok) return null
    return response.json()
  }

  async reschedule(
    code: string,
    scheduledAt: string,
    durationMinutes: number,
    title: string | null
  ): Promise<MeetingSummary | null> {
    const response = await authenticatedPatch(
      { scheduledAt, durationMinutes, title },
      `meetings/${code}`
    )
    if (!response.ok) return null
    return response.json()
  }

  async cancel(code: string): Promise<boolean> {
    const response = await authenticatedPost(null, `meetings/${code}/cancel`)
    return response.ok
  }

  async invitees(code: string): Promise<MeetingInvitee[]> {
    const response = await authenticatedGet(`meetings/${code}/invitees`)
    if (!response.ok) return []
    return response.json()
  }

  /** The canonical meeting link. A real path rather than the app's hash route, because Android
   * App Links and iOS Universal Links match on the path and never see a fragment; the web page
   * at /meet/<code> hands off to the desktop app or falls back to /app/#/meet/<code>. */
  shareLink(code: string): string {
    return `${window.location.origin}/meet/${code}`
  }
}

export const meetingService = new MeetingService()
