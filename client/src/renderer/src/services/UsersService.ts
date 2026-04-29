import {
  authenticatedDelete,
  authenticatedGet,
  authenticatedPatch,
  authenticatedPatchForm,
  authenticatedPost
} from '$src/services/api'
import type { RecentChatUser } from '$src/interfaces/RecentChatUser'
import { authenticationService } from '$src/services/AuthenticationService'
import type { User } from '$src/interfaces/User'
import { encryptionService } from '$src/services/EncryptionService'
import { navigationState } from '$src/states/NavigationState.svelte'
import { sessionState } from '$src/states/SessionState.svelte'
import { usersState } from '$src/states/UsersState.svelte.js'
import { conversationsState } from '$src/states/ConversationsState.svelte.js'

class UsersService {
  select(user: User): void {
    navigationState.selectedUser = user
  }

  setOnline(userId: number): void {
    const existing = usersState.byId.get(userId)
    if (!existing) return
    usersState.byId.set(userId, { ...existing, isOnline: true })
  }

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
    sessionState.currentUser.profilePictureUrl = data.profilePictureUrl
    sessionState.currentUser.displayName = data.displayName
    sessionState.currentUser.email = data.email
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

  loadRecentConversations(decryptedUsers: RecentChatUser[]): void {
    for (const recentUser of decryptedUsers) {
      usersState.add(recentUser.user)
      const existing = conversationsState.conversationMetaById.get(recentUser.conversation.id)
      conversationsState.conversationMetaById.set(recentUser.conversation.id, {
        hasMore: true,
        isLoading: false,
        lastMessage: recentUser.lastMessage ?? '',
        lastMessageTime: recentUser.lastMessageTime ?? new Date().toISOString(),
        lastMessageIncoming: !!recentUser.lastMessageIncoming,
        unread: existing?.unread ?? false,
        lastReadAt: existing?.lastReadAt ?? null
      })
      conversationsState.byId.set(recentUser.conversation.id, recentUser.conversation)
    }
  }
}

export const usersService = new UsersService()
