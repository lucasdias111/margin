import type { User } from '$src/interfaces/User'
import type { Margin } from '$src/interfaces/Margin'

export type ContentType = 'private' | 'margin' | 'explore' | 'settings' | 'manage' | 'notifications'

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

export interface SettingsView {
  type: 'settings'
}

export interface NotificationView {
  type: 'notification'
}

export type contentType =
  | PrivateChatView
  | SpaceView
  | ExploreView
  | NotificationView
  | SettingsView
