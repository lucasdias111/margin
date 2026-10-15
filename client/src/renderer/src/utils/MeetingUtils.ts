import type { Meeting, MeetingSummary } from '$src/interfaces/Meetings'

type Joinable = Pick<MeetingSummary | Meeting, 'status' | 'expiresAt'>

export function isMeetingJoinable(meeting: Joinable, now: Date = new Date()): boolean {
  if (meeting.status !== 'SCHEDULED' && meeting.status !== 'LIVE') return false
  if (!meeting.expiresAt) return false
  return now.getTime() < new Date(meeting.expiresAt).getTime()
}
