export interface User {
  id: number
  username: string
  displayName: string
  email: string
  createdAt: string
  profilePictureUrl: string | null
  isOnline: boolean
}
