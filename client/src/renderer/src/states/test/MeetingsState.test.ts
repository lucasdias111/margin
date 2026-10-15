import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { meetingsState } from '$src/states/MeetingsState.svelte'
import { meetingService } from '$src/services/MeetingService'
import type { MeetingSummary } from '$src/interfaces/Meetings'

vi.mock('$src/services/MeetingService', () => ({
  meetingService: { myMeetings: vi.fn() }
}))

function meeting(
  code: string,
  status: MeetingSummary['status'],
  at: string,
  expiresAt: string = new Date(Date.parse(at) + 24 * 60 * 60 * 1000).toISOString()
): MeetingSummary {
  return {
    id: 1,
    code,
    title: code,
    status,
    marginId: 1,
    marginName: 'Acme',
    hostUserId: 1,
    scheduledAt: at,
    durationMinutes: 30,
    organizerTimezone: 'UTC',
    startedAt: null,
    endedAt: null,
    expiresAt,
    inviteeCount: 0
  }
}

describe('MeetingsState', () => {
  beforeEach(() => {
    // Pin "now" before the fixture dates, so "upcoming" doesn't rot as the calendar moves on.
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-09-01T12:00:00Z'))
    meetingsState.reset()
    vi.mocked(meetingService.myMeetings).mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('stops loading once the fetch resolves', async () => {
    vi.mocked(meetingService.myMeetings).mockResolvedValue([])

    await meetingsState.load()

    expect(meetingsState.loading).toBe(false)
  })

  it('stops loading even when the fetch fails, rather than spinning forever', async () => {
    vi.mocked(meetingService.myMeetings).mockRejectedValue(new Error('offline'))

    await meetingsState.load().catch(() => {})

    expect(meetingsState.loading).toBe(false)
  })

  it('shares one request when two panes mount together', async () => {
    vi.mocked(meetingService.myMeetings).mockResolvedValue([])

    await Promise.all([meetingsState.load(), meetingsState.load()])

    expect(meetingService.myMeetings).toHaveBeenCalledTimes(1)
  })

  it('refetches after the in-flight request settles', async () => {
    vi.mocked(meetingService.myMeetings).mockResolvedValue([])

    await meetingsState.load()
    await meetingsState.load()

    expect(meetingService.myMeetings).toHaveBeenCalledTimes(2)
  })

  it('splits upcoming from past and orders upcoming by start time', async () => {
    vi.mocked(meetingService.myMeetings).mockResolvedValue([
      meeting('later', 'SCHEDULED', '2026-09-03T10:00:00Z'),
      meeting('done', 'ENDED', '2026-09-01T10:00:00Z'),
      meeting('sooner', 'SCHEDULED', '2026-09-02T10:00:00Z')
    ])

    await meetingsState.load()

    expect(meetingsState.upcoming.map((m) => m.code)).toEqual(['sooner', 'later'])
    expect(meetingsState.past.map((m) => m.code)).toEqual(['done'])
  })

  it('treats a scheduled meeting whose window has passed as past, not upcoming', async () => {
    vi.mocked(meetingService.myMeetings).mockResolvedValue([
      meeting('stale', 'SCHEDULED', '2026-08-01T10:00:00Z', '2026-08-02T10:00:00Z'),
      meeting('ahead', 'SCHEDULED', '2026-09-02T10:00:00Z')
    ])

    await meetingsState.load()

    expect(meetingsState.upcoming.map((m) => m.code)).toEqual(['ahead'])
    expect(meetingsState.past.map((m) => m.code)).toEqual(['stale'])
  })

  it('leaves a live meeting upcoming until its window closes', async () => {
    vi.mocked(meetingService.myMeetings).mockResolvedValue([
      meeting('running', 'LIVE', '2026-08-29T10:00:00Z', '2026-12-01T10:00:00Z'),
      meeting('abandoned', 'LIVE', '2026-08-01T10:00:00Z', '2026-08-01T22:00:00Z')
    ])

    await meetingsState.load()

    expect(meetingsState.upcoming.map((m) => m.code)).toEqual(['running'])
    expect(meetingsState.past.map((m) => m.code)).toEqual(['abandoned'])
  })

  it('drops a selection that no longer exists after a refresh', async () => {
    vi.mocked(meetingService.myMeetings).mockResolvedValue([
      meeting('gone', 'SCHEDULED', '2026-09-02T10:00:00Z')
    ])
    await meetingsState.load()
    meetingsState.select('gone')

    vi.mocked(meetingService.myMeetings).mockResolvedValue([])
    await meetingsState.load()

    expect(meetingsState.selectedCode).toBeNull()
  })
})
