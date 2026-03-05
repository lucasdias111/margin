import { authenticatedGet } from '$src/services/api'
import type { RecentChatUser } from '$src/interfaces/RecentChatUser'

class UserService {
  async getRecentChatUsers(userId: number): Promise<RecentChatUser[]> {
    const response = await authenticatedGet(`api/users/${userId}/recent_chat_users`)

    if (!response.ok) {
      return []
    }

    return await response.json()
  }
}

export const userService = new UserService()
