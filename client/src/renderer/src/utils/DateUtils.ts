function parseDate(date: Date | string): Date {
  if (date instanceof Date) return date
  return new Date(date.substring(0, 23))
}

export function formatTimestamp(date: Date | string): string {
  return parseDate(date).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatTime(date: Date | string): string {
  return parseDate(date).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}
