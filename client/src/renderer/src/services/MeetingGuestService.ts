import {
  guestPost,
  publicPost,
  setGuestToken,
  clearGuestToken,
  getGuestToken
} from '$src/services/meetingApi'
import type { MeetingJoinResult } from '$src/interfaces/Meetings'
import { toJoinResult } from '$src/utils/MeetingJoinFailure'
import { encryptionService } from '$src/services/EncryptionService'

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

  async claim(email: string, password: string): Promise<ClaimOutcome> {
    const { publicKey, privateKey } = await encryptionService.generateKeyPair()
    const { encryptedKey, salt, iv } = await encryptionService.encryptPrivateKey(
      privateKey,
      password
    )

    const response = await guestPost('meetings/claim', {
      email,
      password,
      publicKey,
      encryptedPrivateKey: encryptedKey,
      salt,
      iv
    })

    if (response.ok) return 'claimed'
    if (response.status === 409) return 'email-in-use'
    return 'failed'
  }

  async join(code: string): Promise<MeetingJoinResult> {
    return toJoinResult(await guestPost(`meetings/${code}/guest-join`))
  }

  hasSession(): boolean {
    return getGuestToken() !== null
  }

  endSession(): void {
    clearGuestToken()
  }
}

export const meetingGuestService = new MeetingGuestService()
