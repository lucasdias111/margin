import type { Channel } from '$src/interfaces/Channel'
import type { User } from '$src/interfaces/User'

export interface Space {
  spaceId: number
  spaceName: string
  spaceDescription: string
  visibility: string
  marginId: number
  channels: Channel[]
  members: SpaceMember[]
}

export interface SpaceMember {
  user: User
  spaceId: number
  role: string
  joinedAt: string
}

export interface CreateSpace {
  name: string
  description: string
  visibility: string
  marginId: number
}
