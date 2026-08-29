import { beforeEach, describe, expect, it, vi } from 'vitest'
import { meetingGuestService } from '../MeetingGuestService'
import { guestPost, publicPost, getGuestToken, clearGuestToken } from '$src/services/meetingApi'

vi.mock('$src/services/meetingApi', async () => {
  let token: string | null = null
  return {
    publicPost: vi.fn(),
    guestPost: vi.fn(),
    getGuestToken: vi.fn(() => token),
    setGuestToken: vi.fn((t: string) => {
      token = t
    }),
    clearGuestToken: vi.fn(() => {
      token = null
    })
  }
})

function ok(body: unknown): Response {
  return { ok: true, status: 200, json: async () => body } as Response
}

function failed(status: number): Response {
  return { ok: false, status, json: async () => ({}) } as Response
}

describe('MeetingGuestService', () => {
  beforeEach(() => {
    vi.mocked(publicPost).mockReset()
    vi.mocked(guestPost).mockReset()
    clearGuestToken()
  })

  it('fetches a preview without any credential', async () => {
    vi.mocked(publicPost).mockResolvedValue(ok({ code: 'abc', joinable: true }))

    await meetingGuestService.preview('abc')

    expect(publicPost).toHaveBeenCalledWith('meetings/abc/preview')
  })

  it('returns null for an unknown meeting rather than throwing', async () => {
    vi.mocked(publicPost).mockResolvedValue(failed(404))

    await expect(meetingGuestService.preview('nope')).resolves.toBeNull()
  })

  it('stores the guest token so later calls are authenticated', async () => {
    vi.mocked(publicPost).mockResolvedValue(
      ok({ guestToken: 'tok', userId: 5, displayName: 'Wanderer', requiresAdmission: true })
    )

    const session = await meetingGuestService.startSession('abc', 'Wanderer')

    expect(session?.requiresAdmission).toBe(true)
    expect(getGuestToken()).toBe('tok')
    expect(meetingGuestService.hasSession()).toBe(true)
  })

  it('does not store a token when the session is refused', async () => {
    vi.mocked(publicPost).mockResolvedValue(failed(410))

    await expect(meetingGuestService.startSession('abc', 'Late')).resolves.toBeNull()
    expect(getGuestToken()).toBeNull()
  })

  it('reports an in-use email distinctly so the UI can offer sign-in', async () => {
    vi.mocked(guestPost).mockResolvedValue(failed(409))

    await expect(meetingGuestService.claim('taken@margin.chat', 'pw')).resolves.toBe('email-in-use')
  })

  it('reports a successful claim', async () => {
    vi.mocked(guestPost).mockResolvedValue(ok({}))

    await expect(meetingGuestService.claim('new@margin.chat', 'pw')).resolves.toBe('claimed')
  })

  it('claims with a real key pair so the account can be used afterwards', async () => {
    vi.mocked(guestPost).mockResolvedValue(ok({}))

    await meetingGuestService.claim('new@margin.chat', 'pw')

    const body = vi.mocked(guestPost).mock.calls[0][1] as Record<string, string>
    expect(body.publicKey).toBeTruthy()
    expect(body.encryptedPrivateKey).toBeTruthy()
    expect(body.salt).toBeTruthy()
    expect(body.iv).toBeTruthy()
  })

  it('clears the token when the guest leaves', async () => {
    vi.mocked(publicPost).mockResolvedValue(
      ok({ guestToken: 'tok', userId: 5, displayName: 'W', requiresAdmission: false })
    )
    await meetingGuestService.startSession('abc', 'W')

    meetingGuestService.endSession()

    expect(meetingGuestService.hasSession()).toBe(false)
  })
})
