import type { MeetingJoinFailure, MeetingJoinResult } from '$src/interfaces/Meetings'

const MESSAGES: Record<MeetingJoinFailure, string> = {
  full: 'This meeting is full.',
  ended: 'This meeting is no longer available.',
  'not-admitted': 'The host has not let you in yet.',
  unavailable: 'The meeting service is unreachable. Try again in a moment.',
  failed: 'Could not join the meeting.'
}

export function joinFailureMessage(reason: MeetingJoinFailure): string {
  return MESSAGES[reason]
}

export async function toJoinResult(response: Response): Promise<MeetingJoinResult> {
  if (response.ok) return { ok: true, info: await response.json() }

  switch (response.status) {
    case 409:
      return { ok: false, reason: 'full' }
    case 410:
      return { ok: false, reason: 'ended' }
    case 403:
      return { ok: false, reason: 'not-admitted' }
    case 503:
      return { ok: false, reason: 'unavailable' }
    default:
      return { ok: false, reason: 'failed' }
  }
}
