import { unauthenticatedPost } from './api'
import { encryptionService } from './EncryptionService'
import { userState } from '$src/states/UserState.svelte'
import { chatState } from '$src/states/ChatState.svelte'
import { callState } from '$src/states/CallState.svelte'
import { API_CONFIG } from '$src/shared/config'

class AuthenticationService {
  async login(username: string, password: string, rememberMe: boolean = false): Promise<void> {
    const response = await unauthenticatedPost({ username, password }, 'auth/login')
    if (!response.ok) throw new Error('Login failed')

    const authResponse = await response.json()
    if (!authResponse.token) throw new Error('No token in response')

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

    if (rememberMe && privateKey) {
      await window.secureStorage.saveSession(authResponse.token, privateKey)
    }
  }

  async tryRestoreSession(): Promise<boolean> {
    console.log('trying to restore session...')
    const stored = await window.secureStorage.loadSession()
    console.log('stored session:', stored)

    if (!stored) return false

    sessionStorage.setItem('authToken', stored.token)
    sessionStorage.setItem('privateKey', stored.privateKey)
    return true
  }

  async register(
    username: string,
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
      username,
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

  async logoutUser(userId: number): Promise<void> {
    const response = await unauthenticatedPost(
      {
        userId
      },
      'auth/logout'
    )

    if (!response.ok) {
      throw new Error('Logout failed')
    }

    userState.reset()
    chatState.reset()
    callState.endCall()

    await window.secureStorage.clearSession()
    this.clearToken()
  }
}
export const authenticationService = new AuthenticationService()
