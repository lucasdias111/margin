import type { Space } from '$src/interfaces/Space'
import type { User } from '$src/interfaces/User'

export interface Margin {
  marginId: number
  marginName: string
  marginDescription: string
  marginVisibility: string
  marginIconUrl: string
  members: MarginMember[]
  spaces: Space[]
}

export interface MarginMember {
  user: User
  role: MarginRole
  joinedAt: string
}

export enum MarginRole {
  ADMIN = 'Admin',
  MEMBER = 'Member',
  OWNER = 'Owner'
}
