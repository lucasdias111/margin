import { beforeEach, describe, expect, it, vi } from 'vitest'
import { meetingService } from '../MeetingService'
import { authenticatedGet, authenticatedPost } from '$src/services/api'

vi.mock('$src/services/api', () => ({
  authenticatedGet: vi.fn(),
  authenticatedPost: vi.fn()
}))

function ok(body: unknown): Response {
  return { ok: true, json: async () => body } as Response
}

function failed(status: number): Response {
  return { ok: false, status, json: async () => ({}) } as Response
}

describe('MeetingService', () => {
  beforeEach(() => {
    vi.mocked(authenticatedGet).mockReset()
    vi.mocked(authenticatedPost).mockReset()
  })

  it('returns the margins a user may host on behalf of', async () => {
    vi.mocked(authenticatedGet).mockResolvedValue(ok([{ marginId: 3, marginName: 'Acme' }]))

    const margins = await meetingService.loadEligibleMargins()

    expect(authenticatedGet).toHaveBeenCalledWith('meetings/eligible-margins')
    expect(margins).toEqual([{ marginId: 3, marginName: 'Acme' }])
  })

  it('treats an unavailable eligibility list as no eligible margins rather than throwing', async () => {
    vi.mocked(authenticatedGet).mockResolvedValue(failed(500))

    await expect(meetingService.loadEligibleMargins()).resolves.toEqual([])
  })

  it('sends the chosen margin when creating a meeting', async () => {
    vi.mocked(authenticatedPost).mockResolvedValue(ok({ code: 'abc' }))

    await meetingService.createMeeting(7, 'Weekly sync')

    expect(authenticatedPost).toHaveBeenCalledWith(
      { marginId: 7, title: 'Weekly sync' },
      'meetings'
    )
  })

  it('returns null on a 402 so the global upgrade modal is the only free-plan feedback', async () => {
    vi.mocked(authenticatedPost).mockResolvedValue(failed(402))

    await expect(meetingService.createMeeting(7, null)).resolves.toBeNull()
  })

  it('builds a share link on a real path, which is what app links can match', () => {
    expect(meetingService.shareLink('abc123')).toContain('/meet/abc123')
    expect(meetingService.shareLink('abc123')).not.toContain('#')
  })

  it('posts to the join endpoint for the given code', async () => {
    vi.mocked(authenticatedPost).mockResolvedValue(ok({ roomId: 'm_abc123' }))

    const result = await meetingService.join('abc123')

    expect(authenticatedPost).toHaveBeenCalledWith(null, 'meetings/abc123/join')
    expect(result).toEqual({ ok: true, info: { roomId: 'm_abc123' } })
  })

  it('tells a full room apart from an ended one so the caller can say which', async () => {
    vi.mocked(authenticatedPost).mockResolvedValue(failed(409))
    await expect(meetingService.join('abc123')).resolves.toEqual({ ok: false, reason: 'full' })

    vi.mocked(authenticatedPost).mockResolvedValue(failed(410))
    await expect(meetingService.join('abc123')).resolves.toEqual({ ok: false, reason: 'ended' })

    vi.mocked(authenticatedPost).mockResolvedValue(failed(503))
    await expect(meetingService.join('abc123')).resolves.toEqual({
      ok: false,
      reason: 'unavailable'
    })
  })
})
