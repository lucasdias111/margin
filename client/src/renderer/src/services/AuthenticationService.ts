import { unauthenticatedPost } from './api'
import { encryptionService } from './EncryptionService'
import { userState } from '$src/states/UserState.svelte'
import { chatState } from '$src/states/ChatState.svelte'
import { callState } from '$src/states/CallState.svelte'
import { API_CONFIG } from '$src/shared/config'

class AuthenticationService {
  async login(username: string, password: string): Promise<void> {
    const response = await unauthenticatedPost({ username, password }, 'auth/login')

    if (!response.ok) {
      throw new Error('Login failed')
    }

    const authResponse = await response.json()

    if (!authResponse.token) {
      throw new Error('No token in response')
    }

    sessionStorage.setItem('authToken', authResponse.token)

    if (authResponse.encryptedPrivateKey && authResponse.salt && authResponse.iv) {
      const privateKey = await encryptionService.decryptPrivateKey(
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

  getStoredToken(): string | null {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('authToken')
    }
    return null
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

    this.clearToken()
  }
}
export const authenticationService = new AuthenticationService()
