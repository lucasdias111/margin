import type { User } from '$src/interfaces/User'
import type { Space } from '$src/interfaces/Space'

export type ChatViewType = 'private' | 'space' | 'explore' | 'settings'

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

export type ChatView = PrivateChatView | SpaceView | ExploreView
