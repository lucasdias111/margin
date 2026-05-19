import type { StoredFile } from '$src/interfaces/StoredFile'
import {
  authenticatedDelete,
  authenticatedGet,
  authenticatedPatch,
  authenticatedPostForm
} from '$src/services/api'

class FileStorageService {
  async getMarginFiles(marginId: number): Promise<StoredFile[]> {
    const response = await authenticatedGet(`files/margins/${marginId}/stored-files`)
    if (!response.ok) return []
    return (await response.json()) as StoredFile[]
  }

  async getChannelFiles(channelId: number): Promise<StoredFile[]> {
    const response = await authenticatedGet(`files/channels/${channelId}/stored-files`)
    if (!response.ok) return []
    return (await response.json()) as StoredFile[]
  }

  async uploadMarginFile(marginId: number, file: File): Promise<StoredFile | null> {
    const form = new FormData()
    form.append('file', file)
    const response = await authenticatedPostForm(form, `files/margins/${marginId}/stored-files`)
    if (!response.ok) return null
    return (await response.json()) as StoredFile
  }

  async uploadChannelFile(channelId: number, file: File, inline = false): Promise<StoredFile | null> {
    const form = new FormData()
    form.append('file', file)
    const path = `files/channels/${channelId}/stored-files${inline ? '?inline=true' : ''}`
    const response = await authenticatedPostForm(form, path)
    if (!response.ok) return null
    return (await response.json()) as StoredFile
  }

  async deleteFile(fileId: number): Promise<void> {
    await authenticatedDelete(null, `files/stored-files/${fileId}`)
  }

  async renameFile(fileId: number, newName: string): Promise<StoredFile | null> {
    const response = await authenticatedPatch({ fileName: newName }, `files/stored-files/${fileId}`)
    if (!response.ok) return null
    return (await response.json()) as StoredFile
  }

  async downloadFile(fileId: number): Promise<Blob | null> {
    const response = await authenticatedGet(`files/stored-files/${fileId}/download`)
    if (!response.ok) return null

    const blob = await response.blob()
    const filename = parseFilename(response.headers.get('Content-Disposition')) ?? `file-${fileId}`
    triggerBrowserDownload(blob, filename)
    return blob
  }
}

function parseFilename(contentDisposition: string | null): string | null {
  if (!contentDisposition) return null
  const match = /filename="?([^";]+)"?/i.exec(contentDisposition)
  return match ? match[1] : null
}

function triggerBrowserDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export const fileStorageService = new FileStorageService()
