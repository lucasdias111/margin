import type { User } from '$src/interfaces/User'
import { authenticatedGet } from '$src/services/api'

class UserService {
  async getRecentChatUsers(userId: number): Promise<User[]> {
    const response = await authenticatedGet(`users/${userId}/recent_chat_users`)

    if (!response.ok) {
      return []
    }

    return await response.json()
  }

  async getAllUsersForServer(): Promise<User[]> {
    const response = await authenticatedGet(`users/get_all_users`)

    if (!response.ok) {
      return []
    }

    return await response.json()
  }
}

export const userService = new UserService()
