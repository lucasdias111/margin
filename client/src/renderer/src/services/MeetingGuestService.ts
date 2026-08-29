import {
  guestPost,
  publicPost,
  setGuestToken,
  clearGuestToken,
  getGuestToken
} from '$src/services/meetingApi'
import type { MeetingJoinInfo } from '$src/interfaces/Meetings'

export interface MeetingPreview {
  code: string
  title: string | null
  marginName: string
  hostDisplayName: string
  requireAdmission: boolean
  joinable: boolean
}

export interface GuestSession {
  guestToken: string
  userId: number
  displayName: string
  requiresAdmission: boolean
}

export type ClaimOutcome = 'claimed' | 'email-in-use' | 'failed'

class MeetingGuestService {
  async preview(code: string): Promise<MeetingPreview | null> {
    const response = await publicPost(`meetings/${code}/preview`)
    if (!response.ok) return null
    return response.json()
  }

  async startSession(code: string, displayName: string): Promise<GuestSession | null> {
    const response = await publicPost(`meetings/${code}/guest-session`, { displayName })
    if (!response.ok) return null

    const session: GuestSession = await response.json()
    setGuestToken(session.guestToken)
    return session
  }

  async claim(
    email: string,
    password: string,
    keys: { publicKey?: string; encryptedPrivateKey?: string; salt?: string; iv?: string } = {}
  ): Promise<ClaimOutcome> {
    const response = await guestPost('meetings/claim', {
      email,
      password,
      publicKey: keys.publicKey ?? null,
      encryptedPrivateKey: keys.encryptedPrivateKey ?? null,
      salt: keys.salt ?? null,
      iv: keys.iv ?? null
    })

    if (response.ok) return 'claimed'
    if (response.status === 409) return 'email-in-use'
    return 'failed'
  }

  async join(code: string): Promise<MeetingJoinInfo | null> {
    const response = await guestPost(`meetings/${code}/guest-join`)
    if (!response.ok) return null
    return response.json()
  }

  hasSession(): boolean {
    return getGuestToken() !== null
  }

  endSession(): void {
    clearGuestToken()
  }
}

export const meetingGuestService = new MeetingGuestService()
