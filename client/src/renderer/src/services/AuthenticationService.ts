import { authenticatedPost, unauthenticatedPost } from './api'
import { encryptionService } from './EncryptionService'
import { userState } from '$src/states/UserState.svelte'
import { chatState } from '$src/states/ChatState.svelte'
import { callState } from '$src/states/CallState.svelte'
import { API_CONFIG } from '$src/shared/config'
import type { AuthResponse } from '$src/interfaces/AuthResponse'
import { errorService } from '$src/services/ErrorService'
import { webSocketService } from '$src/services/WebSocketService'
import { push } from 'svelte-spa-router'
import { conversationState } from '$src/states/ConversationState.svelte'

class AuthenticationService {
  async login(email: string, password: string, keepLoggedIn: boolean = false): Promise<void> {
    const response = await unauthenticatedPost({ email, password }, 'auth/login')
    const authResponse: AuthResponse = await response.json()
    if (!authResponse.success) {
      errorService.reportError('Error login: ' + authResponse.message)
      throw new Error(authResponse.message)
    }

    sessionStorage.setItem('authToken', authResponse.token)

    let privateKey: string | undefined
    if (authResponse.encryptedPrivateKey && authResponse.salt && authResponse.iv) {
      privateKey = await encryptionService.decryptPrivateKey(
        authResponse.encryptedPrivateKey,
        password,
        authResponse.salt,
        authResponse.iv
      )
      sessionStorage.setItem('privateKey', privateKey)
    }

    if (authResponse.publicKey) {
      sessionStorage.setItem('publicKey', authResponse.publicKey)
    }

    if (keepLoggedIn && privateKey) {
      await window.secureStorage.saveSession(authResponse.token, privateKey)
    }
  }

  async tryRestoreSession(): Promise<boolean> {
    const stored = await window.secureStorage.loadSession()

    if (!stored) return false

    sessionStorage.setItem('authToken', stored.token)
    sessionStorage.setItem('privateKey', stored.privateKey)
    return true
  }

  async register(
    username: string,
    displayName: string,
    password: string,
    email: string,
    betaKey: string,
    profilePicture?: File
  ): Promise<Response> {
    const { publicKey, privateKey } = await encryptionService.generateKeyPairFromPassword(password)

    const { encryptedKey, salt, iv } = await encryptionService.encryptPrivateKey(
      privateKey,
      password
    )

    const formData = new FormData()

    const registrationData = {
      username,
      displayName,
      password,
      email,
      betaKey,
      publicKey,
      encryptedPrivateKey: encryptedKey,
      salt,
      iv
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

  clearToken(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('authToken')
    }
  }

  async logoutUser(): Promise<void> {
    webSocketService.disconnect()

    const response = await authenticatedPost({}, 'auth/logout')
    if (!response.ok) {
      errorService.reportError('Failed to log out.')
    }

    userState.reset()
    chatState.reset()
    conversationState.reset()
    callState.endCall()

    await window.secureStorage.clearSession()
    this.clearToken()
    await push('/')
  }
}
export const authenticationService = new AuthenticationService()
