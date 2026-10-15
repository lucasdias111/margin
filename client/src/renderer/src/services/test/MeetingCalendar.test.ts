import { describe, expect, it } from 'vitest'

function dayKey(date: Date, zone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: zone }).format(date)
}

function monthCells(cursor: Date): Date[] {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
  const offset = (first.getDay() + 6) % 7
  const start = new Date(first)
  start.setDate(first.getDate() - offset)
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

describe('calendar grid layout', () => {
  it('always starts the week on Monday', () => {
    const cells = monthCells(new Date(2026, 8, 1))

    expect(cells[0].getDay()).toBe(1)
  })

  it('covers six weeks so every month fits without reflowing', () => {
    expect(monthCells(new Date(2026, 1, 1))).toHaveLength(42)
    expect(monthCells(new Date(2026, 7, 1))).toHaveLength(42)
  })

  it('includes the first and last day of the month', () => {
    const keys = monthCells(new Date(2026, 8, 1)).map((d) => dayKey(d, 'UTC'))

    expect(keys).toContain('2026-09-01')
    expect(keys).toContain('2026-09-30')
  })

  it('handles a month that begins on a Sunday', () => {
    const cells = monthCells(new Date(2026, 2, 1))

    expect(cells[0].getDay()).toBe(1)
    expect(cells.map((d) => dayKey(d, 'UTC'))).toContain('2026-03-01')
  })
})

describe('placing meetings on days', () => {
  it('puts a meeting on the day the reader sees it, not the UTC day', () => {
    const lateNightUtc = new Date('2026-09-02T23:30:00Z')

    expect(dayKey(lateNightUtc, 'Europe/Lisbon')).toBe('2026-09-03')
    expect(dayKey(lateNightUtc, 'America/New_York')).toBe('2026-09-02')
  })

  it('groups meetings that share a day in the reader zone', () => {
    const zone = 'Europe/Copenhagen'
    const morning = new Date('2026-09-02T07:00:00Z')
    const evening = new Date('2026-09-02T19:00:00Z')

    expect(dayKey(morning, zone)).toBe(dayKey(evening, zone))
  })
})
