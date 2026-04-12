export interface User {
  id: number
  handle: string
  displayName: string
  email: string
  createdAt: string
  profilePictureUrl: string | null
  isOnline: boolean
}
