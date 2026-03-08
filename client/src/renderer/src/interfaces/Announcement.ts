import type { User } from '$src/interfaces/User'

export interface Announcement {
  announcementId: number
  marginId: number
  author: User
  title: string
  content: string
  createdAt: string
  editedAt: string
}
