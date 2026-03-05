import type { User } from '$src/interfaces/User'

export interface UserSearchResult {
  user: User | null
  isOnline: boolean
}
