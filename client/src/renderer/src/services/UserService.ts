import { authenticatedDelete, authenticatedGet, authenticatedPatchForm } from '$src/services/api'
import type { RecentChatUser } from '$src/interfaces/RecentChatUser'
import { userState } from '$src/states/UserState.svelte'
import { authenticationService } from '$src/services/AuthenticationService'

class UserService {
  async getRecentChatUsers(): Promise<RecentChatUser[]> {
    const response = await authenticatedGet(`users/recent_chat_users`)

    if (!response.ok) {
      return []
    }

    return await response.json()
  }

  async updateUserInfo(formData: FormData): Promise<void> {
    const response = await authenticatedPatchForm(formData, 'users/update_user_info')
    if (!response.ok) throw new Error('Update failed')

    const data = await response.json()
    userState.currentUser.profilePictureUrl = data.profilePictureUrl
    userState.currentUser.displayName = data.displayName
    userState.currentUser.email = data.email
  }

  async deleteAccount(): Promise<void> {
    await authenticatedDelete(null, 'users/delete')
    await authenticationService.clear()
  }
}

export const userService = new UserService()
