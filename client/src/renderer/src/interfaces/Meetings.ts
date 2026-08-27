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
  participants: MeetingParticipantInfo[]
}

export interface EligibleMargin {
  marginId: number
  marginName: string
}

export interface MeetingJoinInfo {
  sfuUrl: string
  roomId: string
  roomToken: string
  maxVideoHeight: number | null
}
