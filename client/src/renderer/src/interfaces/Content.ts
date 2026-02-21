import type { User } from '$src/interfaces/User'
import type { Space } from '$src/interfaces/Space'

export type ContentType = 'private' | 'space' | 'explore' | 'settings' | 'manage'

export interface PrivateChatView {
  type: 'private'
  user: User
}

export interface SpaceView {
  type: 'space'
  space: Space
}

export interface ExploreView {
  type: 'explore'
}

export type contentType = PrivateChatView | SpaceView | ExploreView
