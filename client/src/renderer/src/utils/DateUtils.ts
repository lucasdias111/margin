function parseDate(date: Date | string): Date {
  if (!date) return new Date()
  if (date instanceof Date) return date
  return new Date(date)
}

const timestampFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})

const timeFormatter = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit'
})

const dayMonthFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short'
})

const weekdayFormatter = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long'
})

export function formatTimestamp(date: Date | string): string {
  return timestampFormatter.format(parseDate(date))
}

export function formatTime(date: Date | string): string {
  return timeFormatter.format(parseDate(date))
}

export function formatConversationTimestamp(date: Date | string): string {
  const then = parseDate(date)
  const now = new Date()

  if (then.toDateString() === now.toDateString()) {
    return formatTime(then)
  }

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (then.toDateString() === yesterday.toDateString()) {
    return 'Yesterday'
  }

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diffDays = Math.floor((startOfToday.getTime() - then.getTime()) / 86_400_000)
  if (diffDays < 7) {
    return weekdayFormatter.format(then)
  }

  return dayMonthFormatter.format(then)
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export function formatLastSeen(date: Date | string | null | undefined): string {
  if (!date) return 'Last seen a while ago'

  const seen = parseDate(date)
  const now = new Date()
  const diffMs = now.getTime() - seen.getTime()
  const diffMin = Math.floor(diffMs / 60_000)

  if (diffMin < 1) return 'Last seen just now'
  if (diffMin < 60) return `Last seen ${diffMin} min ago`

  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24 && seen.getDate() === now.getDate()) {
    return `Last seen ${diffHours}h ago`
  }

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (seen.toDateString() === yesterday.toDateString()) {
    return `Last seen yesterday at ${formatTime(seen)}`
  }

  return `Last seen ${dayMonthFormatter.format(seen)}`
}
