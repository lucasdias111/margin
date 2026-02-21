import type { Channel } from '$src/interfaces/Channel'
import type { User } from '$src/interfaces/User'

export interface Space {
  spaceId: number
  spaceName: string
  spaceDescription: string
  visibility: string
  channels: Channel[]
  members: SpaceMember[]
}

export interface SpaceMember {
  user: User
  role: string
  joinedAt: string
}
