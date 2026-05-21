import { authenticatedPost, setUnauthenticatedHandler, unauthenticatedPost } from './api'
import { encryptionService } from './EncryptionService'
import { usersState } from '$src/states/UsersState.svelte.js'
import { callState } from '$src/states/CallState.svelte'
import { API_CONFIG } from '$src/shared/config'
import type { AuthResponse } from '$src/interfaces/AuthResponse'
import { errorService } from '$src/services/ErrorService'
import { webSocketService } from '$src/services/WebSocketService'
import { push } from 'svelte-spa-router'
import { isElectron } from '$src/utils/platformUtils'
import { navigationService } from '$src/services/NavigationService'

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
      await this.saveSession(authResponse.token, privateKey)
    }
  }

  async tryRestoreSession(): Promise<boolean> {
    const stored = await this.loadSession()

    if (!stored) return false

    sessionStorage.setItem('authToken', stored.token)
    sessionStorage.setItem('privateKey', stored.privateKey)
    return true
  }

  private async saveSession(token: string, privateKey: string): Promise<void> {
    if (isElectron()) {
      await window.secureStorage!.saveSession(token, privateKey)
    } else {
      localStorage.setItem('session_token', token)
      localStorage.setItem('session_privateKey', privateKey)
    }
  }

  private async loadSession(): Promise<{ token: string; privateKey: string } | null> {
    if (isElectron()) {
      return window.secureStorage!.loadSession()
    }
    const token = localStorage.getItem('session_token')
    const privateKey = localStorage.getItem('session_privateKey')
    if (!token || !privateKey) return null
    return { token, privateKey }
  }

  private async clearSession(): Promise<void> {
    if (isElectron()) {
      await window.secureStorage!.clearSession()
    } else {
      localStorage.removeItem('session_token')
      localStorage.removeItem('session_privateKey')
    }
  }

  async forgotPassword(email: string): Promise<void> {
    const response = await unauthenticatedPost({ email }, 'auth/forgot-password')
    if (!response.ok) {
      throw new Error('Request failed')
    }
  }

  async register(
    handle: string,
    displayName: string,
    password: string,
    email: string,
    profilePicture?: File
  ): Promise<Response> {
    const { publicKey, privateKey } = await encryptionService.generateKeyPairFromPassword(password)

    const { encryptedKey, salt, iv } = await encryptionService.encryptPrivateKey(
      privateKey,
      password
    )

    const formData = new FormData()

    const registrationData = {
      handle: handle,
      displayName,
      password,
      email,
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
    const response = await authenticatedPost({}, 'auth/logout')
    if (!response.ok) {
      errorService.reportError('Failed to log out.')
    }
    await this.clear()
  }

  public async clear(): Promise<void> {
    webSocketService.disconnect()
    usersState.reset()
    navigationService.reset()
    callState.endCall()

    await this.clearSession()
    this.clearToken()
    await push('/')
  }
}
export const authenticationService = new AuthenticationService()

setUnauthenticatedHandler(() => authenticationService.clear())
