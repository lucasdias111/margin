export interface User {
  id: number
  displayName: string
  // Personal data: only populated for the authenticated user themselves (`/me`).
  email?: string
  createdAt: string
  profilePictureUrl: string | null
  lastSeenAt: string | null
  isOnline: boolean
  // The instance role: only populated for the authenticated user themselves (`/me`).
  role?: InstanceRole
}

export type InstanceRole = 'USER' | 'ADMIN'
