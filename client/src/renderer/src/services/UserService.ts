import {
  authenticatedDelete,
  authenticatedGet,
  authenticatedPatch,
  authenticatedPatchForm,
  authenticatedPost
} from '$src/services/api'
import type { RecentChatUser } from '$src/interfaces/RecentChatUser'
import { userState } from '$src/states/UserState.svelte'
import { authenticationService } from '$src/services/AuthenticationService'
import type { User } from '$src/interfaces/User'
import { encryptionService } from '$src/services/EncryptionService'

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

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const authToken = sessionStorage.getItem('authToken')
    if (!authToken) throw new Error('Not authenticated')

    const keyResponse = await authenticatedGet('users/me/private-key')
    const { encryptedPrivateKey, salt, iv } = await keyResponse.json()

    const rawPrivateKey = await encryptionService.decryptPrivateKey(
      encryptedPrivateKey,
      currentPassword,
      salt,
      iv
    )
    const reEncrypted = await encryptionService.encryptPrivateKey(rawPrivateKey, newPassword)

    await authenticatedPatch(
      {
        currentPassword,
        newPassword,
        encryptedPrivateKey: reEncrypted.encryptedKey,
        salt: reEncrypted.salt,
        iv: reEncrypted.iv
      },
      'users/password'
    )
  }

  async reportBug(bugTitle: string, bugDescription: string): Promise<void> {
    const response = await authenticatedPost({ bugTitle, bugDescription }, 'users/report_bug')
    if (!response.ok) {
      throw new Error('Bug report failed')
    }
  }
}

export const userService = new UserService()
