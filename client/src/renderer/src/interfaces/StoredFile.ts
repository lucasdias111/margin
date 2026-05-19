import type { User } from '$src/interfaces/User'

export type StoredFileScope = 'MARGIN' | 'CHANNEL'

export interface StoredFile {
  fileId: number
  scope: StoredFileScope
  marginId: number
  channelId: number | null
  fileName: string
  contentType: string
  sizeBytes: number
  url: string
  uploadedBy: User
  uploadedAt: string
}
