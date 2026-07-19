import { describe, it, expect } from 'vitest'
import { lastMessagePreviewText } from '$src/utils/messagePreview'
import type { Message } from '$src/interfaces/Messages'
import type { StoredFile } from '$src/interfaces/StoredFile'

function buildMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: 1,
    conversationId: 1,
    conversationType: 'DIRECT',
    user: { id: 1 } as Message['user'],
    content: '',
    isEdited: false,
    createdAt: new Date().toISOString(),
    reactions: [],
    attachments: [],
    ...overrides
  }
}

function imageFile(contentType = 'image/png'): StoredFile {
  return { fileName: 'pic.png', contentType } as StoredFile
}

describe('lastMessagePreviewText', () => {
  it('returns the text content when present', () => {
    expect(lastMessagePreviewText(buildMessage({ content: 'hello' }))).toBe('hello')
  })

  it('returns "Image" for an attachment-only image message', () => {
    expect(lastMessagePreviewText(buildMessage({ attachments: [imageFile()] }))).toBe('Image')
  })

  it('returns "Image" for an optimistic (local) image attachment', () => {
    const msg = buildMessage({
      localAttachments: [{ fileName: 'pic.png', contentType: 'image/jpeg', previewUrl: 'blob:x' }]
    })
    expect(lastMessagePreviewText(msg)).toBe('Image')
  })

  it('prefers the caption text over the "Image" label', () => {
    const msg = buildMessage({ content: 'look at this', attachments: [imageFile()] })
    expect(lastMessagePreviewText(msg)).toBe('look at this')
  })

  it('does not label non-image attachments as "Image"', () => {
    const msg = buildMessage({ attachments: [imageFile('application/pdf')] })
    expect(lastMessagePreviewText(msg)).toBe('')
  })
})
