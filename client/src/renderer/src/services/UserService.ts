import { authenticatedGet, authenticatedPatchForm } from '$src/services/api'
import type { RecentChatUser } from '$src/interfaces/RecentChatUser'
import { errorService } from '$src/services/ErrorService'
import { userState } from '$src/states/UserState.svelte'

class UserService {
  async getRecentChatUsers(userId: number): Promise<RecentChatUser[]> {
    const response = await authenticatedGet(`api/users/${userId}/recent_chat_users`)

    if (!response.ok) {
      return []
    }

    return await response.json()
  }

  async updateUserInfo(formData: FormData): Promise<void> {
    const response = await authenticatedPatchForm(formData, 'api/users/me')

    if (!response.ok) {
      errorService.reportError('Failed to edit.')
    } else {
      const data = await response.json()
      userState.currentUser.profilePictureUrl = data.profilePictureUrl
      userState.currentUser.displayName = data.displayName
      userState.currentUser.email = data.email
    }
  }
}

export const userService = new UserService()
