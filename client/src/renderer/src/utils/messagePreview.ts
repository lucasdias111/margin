import type { Message } from '$src/interfaces/Messages'

function hasImageAttachment(message: Message): boolean {
  const attachments = message.attachments ?? []
  const localAttachments = message.localAttachments ?? []
  return (
    attachments.some((a) => a.contentType?.startsWith('image/')) ||
    localAttachments.some((a) => a.contentType?.startsWith('image/'))
  )
}

export function lastMessagePreviewText(message: Message): string | null {
  if (message.content && message.content.trim().length > 0) return message.content
  if (hasImageAttachment(message)) return 'Image'
  return message.content ?? null
}
