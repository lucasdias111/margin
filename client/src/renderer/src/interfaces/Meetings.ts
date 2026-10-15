export type MeetingStatus = 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED'
export type MeetingRole = 'HOST' | 'COHOST' | 'PARTICIPANT'
export type ParticipantState = 'KNOCKING' | 'ADMITTED' | 'DENIED' | 'JOINED' | 'LEFT' | 'REMOVED'

export interface MeetingParticipantInfo {
  participantId: number
  userId: number | null
  displayName: string
  guest: boolean
  role: MeetingRole
  state: ParticipantState
  connected: boolean
}

export interface Meeting {
  id: number
  code: string
  title: string | null
  status: MeetingStatus
  marginId: number
  marginName: string
  hostUserId: number
  requireAdmission: boolean
  maxParticipants: number
  scheduledAt: string | null
  durationMinutes: number | null
  startedAt: string | null
  endedAt: string | null
  expiresAt: string | null
  participants: MeetingParticipantInfo[]
}

export interface EligibleMargin {
  marginId: number
  marginName: string
}

export type MeetingJoinFailure = 'full' | 'ended' | 'not-admitted' | 'unavailable' | 'failed'

export type MeetingJoinResult =
  | { ok: true; info: MeetingJoinInfo }
  | { ok: false; reason: MeetingJoinFailure }

export interface MeetingJoinInfo {
  sfuUrl: string
  roomId: string
  roomToken: string
  peerId: string
  displayName: string
  title: string | null
}

export interface MeetingSummary {
  id: number
  code: string
  title: string | null
  status: MeetingStatus
  marginId: number
  marginName: string
  hostUserId: number
  scheduledAt: string | null
  durationMinutes: number | null
  organizerTimezone: string | null
  startedAt: string | null
  endedAt: string | null
  expiresAt: string | null
  inviteeCount: number
}

export interface MeetingInvitee {
  inviteId: number
  userId: number | null
  displayName: string | null
  email: string | null
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED'
}

export interface ScheduleMeetingInput {
  marginId: number
  title: string | null
  scheduledAt: string
  durationMinutes: number
  organizerTimezone: string
  invitees: { userId: number | null; email: string | null }[]
}
