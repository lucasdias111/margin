import { authenticatedGet } from '$src/services/api'
import type { RecentChatUsers } from '$src/interfaces/RecentChatUsers'

class UserService {
  async getRecentChatUsers(userId: number): Promise<RecentChatUsers[]> {
    const response = await authenticatedGet(`api/users/${userId}/recent_chat_users`)

    if (!response.ok) {
      return []
    }

    return await response.json()
  }
}

export const userService = new UserService()
