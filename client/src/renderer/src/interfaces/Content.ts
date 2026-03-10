import type { User } from '$src/interfaces/User'
import type { Margin } from '$src/interfaces/Margin'

export type ContentType = 'private' | 'margin' | 'notifications' | 'settings' | 'manage'

export interface PrivateChatView {
  type: 'private'
  user: User
}

export interface SpaceView {
  type: 'margin'
  margin: Margin
}

export interface ExploreView {
  type: 'explore'
}

export interface NotificationView {
  type: 'notification'
}

export type contentType = PrivateChatView | SpaceView | ExploreView
