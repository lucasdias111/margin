import {
  authenticatedPost,
  authenticatedPut,
  setTokenRefresher,
  setUnauthenticatedHandler,
  unauthenticatedPost
} from './api'
import { encryptionService } from './EncryptionService'
import { usersState } from '$src/states/UsersState.svelte.js'
import { callState } from '$src/states/CallState.svelte'
import { incomingCallState } from '$src/states/IncomingCallState.svelte'
import { API_CONFIG } from '$src/shared/config'
import type { AuthResponse } from '$src/interfaces/AuthResponse'
import { errorService } from '$src/services/ErrorService'
import { webSocketService } from '$src/services/websocket/WebSocketService'
import { push } from 'svelte-spa-router'
import { desktopBridge, type StoredSession } from '$src/services/DesktopBridge'
import { webPushService } from '$src/services/WebPushService'
import { navigationService } from '$src/services/NavigationService'
import { marginState } from '$src/states/MarginState.svelte'
import { spaceState } from '$src/states/SpaceState.svelte'
import { notificationState } from '$src/states/NotificationState.svelte'
import { conversationsState } from '$src/states/ConversationsState.svelte'
import { threadsState } from '$src/states/ThreadsState.svelte'
import { conversationInviteService } from '$src/states/UserListState.svelte'
import { sessionState } from '$src/states/SessionState.svelte'

class AuthenticationService {
  async login(email: string, password: string, keepLoggedIn: boolean = false): Promise<void> {
    const response = await unauthenticatedPost({ email, password }, 'auth/login')
    const authResponse: AuthResponse = await response.json()
    if (!authResponse.success) {
      const message = authResponse.message ?? ''
      const isNotActivated = /not yet activated/i.test(message)
      if (!isNotActivated) {
        errorService.reportError('Error login: ' + message)
      }
      throw new Error(message)
    }

    sessionStorage.setItem('authToken', authResponse.token)
    sessionStorage.setItem('refreshToken', authResponse.refreshToken)

    let privateKey: string | undefined
    let publicKey: string | undefined = authResponse.publicKey ?? undefined

    if (authResponse.encryptedPrivateKey && authResponse.salt && authResponse.iv) {
      privateKey = await encryptionService.decryptPrivateKey(
        authResponse.encryptedPrivateKey,
        password,
        authResponse.salt,
        authResponse.iv
      )
    } else {
      const regenerated = await this.regenerateEncryptionKeys(password)
      privateKey = regenerated.privateKey
      publicKey = regenerated.publicKey
    }

    sessionStorage.setItem('privateKey', privateKey)
    if (publicKey) {
      sessionStorage.setItem('publicKey', publicKey)
    }

    if (keepLoggedIn) {
      await this.saveSession(authResponse.token, privateKey, authResponse.refreshToken)
    }
  }

  async refreshTokens(): Promise<boolean> {
    const refreshToken = sessionStorage.getItem('refreshToken')
    if (!refreshToken) return false

    try {
      const response = await unauthenticatedPost({ refreshToken }, 'auth/refresh')
      if (!response.ok) return false

      const authResponse: AuthResponse = await response.json()
      if (!authResponse.success || !authResponse.token) return false

      sessionStorage.setItem('authToken', authResponse.token)
      sessionStorage.setItem('refreshToken', authResponse.refreshToken)

      if (await this.hasPersistedSession()) {
        const privateKey = sessionStorage.getItem('privateKey')
        if (privateKey) {
          await this.saveSession(authResponse.token, privateKey, authResponse.refreshToken)
        }
      }
      return true
    } catch {
      return false
    }
  }

  private async hasPersistedSession(): Promise<boolean> {
    return (await this.loadSession()) !== null
  }

  private async regenerateEncryptionKeys(
    password: string
  ): Promise<{ publicKey: string; privateKey: string }> {
    const { publicKey, privateKey } = await encryptionService.generateKeyPair()
    const { encryptedKey, salt, iv } = await encryptionService.encryptPrivateKey(
      privateKey,
      password
    )
    await authenticatedPut(
      { publicKey, encryptedPrivateKey: encryptedKey, salt, iv },
      'auth/encryption-keys'
    )
    return { publicKey, privateKey }
  }

  async tryRestoreSession(): Promise<boolean> {
    const stored = await this.loadSession()

    if (!stored) return false

    sessionStorage.setItem('authToken', stored.token)
    sessionStorage.setItem('privateKey', stored.privateKey)
    if (stored.refreshToken) {
      sessionStorage.setItem('refreshToken', stored.refreshToken)
    }

    if (!stored.refreshToken) return false

    return true
  }

  private async saveSession(
    token: string,
    privateKey: string,
    refreshToken: string
  ): Promise<void> {
    const secureStorage = desktopBridge.secureStorage
    if (secureStorage) {
      await secureStorage.save({ token, privateKey, refreshToken })
    } else {
      localStorage.setItem('session_token', token)
      localStorage.setItem('session_privateKey', privateKey)
      localStorage.setItem('session_refreshToken', refreshToken)
    }
  }

  private async loadSession(): Promise<StoredSession | null> {
    const secureStorage = desktopBridge.secureStorage
    if (secureStorage) {
      return secureStorage.load()
    }
    const token = localStorage.getItem('session_token')
    const privateKey = localStorage.getItem('session_privateKey')
    if (!token || !privateKey) return null
    return { token, privateKey, refreshToken: localStorage.getItem('session_refreshToken') }
  }

  private async clearSession(): Promise<void> {
    const secureStorage = desktopBridge.secureStorage
    if (secureStorage) {
      await secureStorage.clear()
    } else {
      localStorage.removeItem('session_token')
      localStorage.removeItem('session_privateKey')
      localStorage.removeItem('session_refreshToken')
    }
  }

  async forgotPassword(email: string): Promise<void> {
    const response = await unauthenticatedPost({ email }, 'auth/forgot-password')
    if (!response.ok) {
      throw new Error('Request failed')
    }
  }

  async register(
    displayName: string,
    password: string,
    email: string,
    profilePicture?: File,
    inviteCode?: string
  ): Promise<Response> {
    const { publicKey, privateKey } = await encryptionService.generateKeyPair()

    const { encryptedKey, salt, iv } = await encryptionService.encryptPrivateKey(
      privateKey,
      password
    )

    const formData = new FormData()

    const registrationData = {
      displayName,
      password,
      email,
      publicKey,
      encryptedPrivateKey: encryptedKey,
      salt,
      iv,
      ...(inviteCode ? { inviteCode } : {})
    }

    formData.append(
      'data',
      new Blob([JSON.stringify(registrationData)], {
        type: 'application/json'
      })
    )

    if (profilePicture) {
      formData.append('profilePicture', profilePicture)
    }

    const response = await fetch(API_CONFIG.baseUrl + 'auth/register', {
      method: 'POST',
      body: formData
    })

    if (response.ok) {
      sessionStorage.setItem('publicKey', publicKey)
      sessionStorage.setItem('privateKey', privateKey)
    }

    return response
  }

  /** Whether a first-admin setup link is still valid. */
  async isSetupTokenValid(token: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_CONFIG.baseUrl}setup/${encodeURIComponent(token)}`)
      return response.ok
    } catch {
      return false
    }
  }

  /** Creates the instance's first admin from the one-time setup link. */
  async completeSetup(
    token: string,
    displayName: string,
    email: string,
    password: string
  ): Promise<boolean> {
    const { publicKey, privateKey } = await encryptionService.generateKeyPair()
    const { encryptedKey, salt, iv } = await encryptionService.encryptPrivateKey(
      privateKey,
      password
    )
    const response = await fetch(`${API_CONFIG.baseUrl}setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        displayName,
        email,
        password,
        publicKey,
        encryptedPrivateKey: encryptedKey,
        salt,
        iv
      })
    })
    return response.ok
  }

  async activateAccount(token: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${API_CONFIG.baseUrl}auth/activate/${encodeURIComponent(token)}`,
        { method: 'POST' }
      )
      return response.ok
    } catch {
      return false
    }
  }

  /** Returns null on success, otherwise the server's reason. */
  async resetPassword(token: string, newPassword: string): Promise<string | null> {
    try {
      const response = await fetch(`${API_CONFIG.baseUrl}auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
      })
      if (response.ok) return null
      const body = await response.json().catch(() => null)
      return body?.message ?? body?.detail ?? 'This reset link is invalid or has expired.'
    } catch {
      return 'Could not reach the server.'
    }
  }

  clearToken(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('authToken')
      sessionStorage.removeItem('refreshToken')
    }
  }

  async logoutUser(): Promise<void> {
    // A signed-out browser shouldn't keep receiving this user's notifications.
    await webPushService.disable().catch(() => {})
    const refreshToken = sessionStorage.getItem('refreshToken')
    const response = await authenticatedPost({ refreshToken }, 'auth/logout')
    if (!response.ok) {
      errorService.reportError('Failed to log out.')
    }
    await this.clear()
  }

  public async clear(): Promise<void> {
    webSocketService.disconnect()
    callState.endCall()
    incomingCallState.clear()

    usersState.reset()
    navigationService.reset()
    marginState.clear()
    spaceState.clear()
    notificationState.clear()
    conversationsState.clear()
    threadsState.clear()
    conversationInviteService.clear()
    sessionState.clear()

    sessionStorage.removeItem('privateKey')
    sessionStorage.removeItem('publicKey')

    await this.clearSession()
    this.clearToken()
    await push('/')
  }
}
export const authenticationService = new AuthenticationService()

setUnauthenticatedHandler(() => authenticationService.clear())
setTokenRefresher(() => authenticationService.refreshTokens())
