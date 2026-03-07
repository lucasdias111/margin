import type { Space } from '$src/interfaces/Space'
import type { User } from '$src/interfaces/User'
import type { Visibility } from '$src/interfaces/Visibility'

export interface Margin {
  marginId: number
  marginName: string
  marginDescription: string
  visibility: string
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
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  OWNER = 'OWNER'
}

export interface UpdateMargin {
  marginId: number
  marginName: string
  description?: string
  marginIcon?: File
}

export interface CreateMargin {
  marginName: string
  marginDescription?: string
  visibility: Visibility
}
