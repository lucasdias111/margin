import { authenticatedGet, authenticatedPatch, authenticatedPost } from '$src/services/api'
import { webSocketService } from '$src/services/websocket/WebSocketService'
import { WebSocketMessageType } from '$src/interfaces/WebSocketMessageType'
import { toJoinResult } from '$src/utils/MeetingJoinFailure'
import { instanceService } from '$src/services/InstanceService'
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

  /** Saves the meeting as an .ics file, so hosts can share it without mail. Host only. */
  async downloadCalendarFile(code: string): Promise<void> {
    const response = await authenticatedGet(`meetings/${code}/calendar.ics`)
    if (!response.ok) return
    const url = URL.createObjectURL(await response.blob())
    const link = document.createElement('a')
    link.href = url
    link.download = `meeting-${code}.ics`
    link.click()
    URL.revokeObjectURL(url)
  }

  /** The canonical meeting link, on the instance's public URL. A real path rather than the
   * app's hash route, so it reads well and survives being pasted anywhere; the web app maps
   * /meet/<code> onto its own route when it loads. */
  shareLink(code: string): string {
    return instanceService.publicLink(`/meet/${code}`)
  }
}

export const meetingService = new MeetingService()
