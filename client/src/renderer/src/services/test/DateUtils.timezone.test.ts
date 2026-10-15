import { describe, expect, it, vi, afterEach } from 'vitest'
import {
  availableTimeZones,
  formatInZone,
  formatMeetingWhen,
  toLocalInputValue,
  viewerTimeZone
} from '$src/utils/DateUtils'

function pretendViewerIsIn(zone: string): void {
  const original = Intl.DateTimeFormat().resolvedOptions()
  vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({
    ...original,
    timeZone: zone
  })
}

afterEach(() => vi.restoreAllMocks())

describe('timezone formatting', () => {
  it('renders the same instant differently in different zones', () => {
    const instant = '2026-09-02T13:00:00Z'

    expect(formatInZone(instant, 'Europe/Lisbon')).toContain('14:00')
    expect(formatInZone(instant, 'Asia/Tokyo')).toContain('22:00')
  })

  it('follows daylight saving rather than a fixed offset', () => {
    const summer = formatInZone('2026-07-01T12:00:00Z', 'Europe/Lisbon')
    const winter = formatInZone('2026-01-01T12:00:00Z', 'Europe/Lisbon')

    expect(summer).toContain('13:00')
    expect(winter).toContain('12:00')
  })

  it('shows only one time when the viewer is in the organiser zone', () => {
    pretendViewerIsIn('Europe/Lisbon')

    const line = formatMeetingWhen('2026-09-02T13:00:00Z', 'Europe/Lisbon')

    expect(line).not.toContain('·')
  })

  it('shows both times when the viewer is somewhere else', () => {
    pretendViewerIsIn('Asia/Tokyo')

    const line = formatMeetingWhen('2026-09-02T13:00:00Z', 'Europe/Lisbon')

    expect(line).toContain('22:00')
    expect(line).toContain('14:00')
    expect(line).toContain('Europe/Lisbon')
  })

  it('falls back to the viewer zone when the organiser zone is unknown', () => {
    pretendViewerIsIn('Asia/Tokyo')

    expect(formatMeetingWhen('2026-09-02T13:00:00Z', null)).toContain('22:00')
  })

  it('reports a real zone for the viewer', () => {
    expect(availableTimeZones()).toContain(viewerTimeZone())
  })

  it('round-trips a date into the value a datetime-local input expects', () => {
    const value = toLocalInputValue(new Date(2026, 8, 2, 15, 4))

    expect(value).toBe('2026-09-02T15:04')
    expect(new Date(value).getHours()).toBe(15)
  })
})
