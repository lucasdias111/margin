export interface User {
  id: number
  handle: string
  displayName: string
  email: string
  createdAt: string
  profilePictureUrl: string | null
  lastSeenAt: string | null
  isOnline: boolean
}
