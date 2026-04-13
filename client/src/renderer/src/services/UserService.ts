import {
  authenticatedDelete,
  authenticatedGet,
  authenticatedPatchForm,
  authenticatedPost
} from '$src/services/api'
import type { RecentChatUser } from '$src/interfaces/RecentChatUser'
import { userState } from '$src/states/UserState.svelte'
import { authenticationService } from '$src/services/AuthenticationService'
import type { User } from '$src/interfaces/User'

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

  async getById(userId: number): Promise<User> {
    const response = await authenticatedGet(`users/${userId}`)
    return await response.json()
  }

  async reportBug(bugTitle: string, bugDescription: string): Promise<void> {
    const response = await authenticatedPost({ bugTitle, bugDescription }, 'users/report_bug')
    return await response.json()
  }
}

export const userService = new UserService()
