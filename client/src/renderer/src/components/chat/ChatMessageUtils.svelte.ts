export function formatTimestamp(date: Date | string): string {
  const messageDate = new Date(date)

  return messageDate.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}
