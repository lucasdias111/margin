import { beforeEach, describe, expect, it, vi } from 'vitest'
import { authenticationService } from '../AuthenticationService'
import { encryptionService } from '$src/services/EncryptionService'
import { errorService } from '$src/services/ErrorService'
import { webSocketService } from '$src/services/WebSocketService'
import { userState } from '$src/states/UserState.svelte'
import { chatState } from '$src/states/ChatState.svelte'
import { conversationState } from '$src/states/ConversationState.svelte'
import { callState } from '$src/states/CallState.svelte'
import * as api from '$src/services/api'
import * as svelteRouter from 'svelte-spa-router'
import type { AuthResponse } from '$src/interfaces/AuthResponse'

vi.mock('$src/services/EncryptionService', () => ({
  encryptionService: {
    decryptPrivateKey: vi.fn(),
    generateKeyPairFromPassword: vi.fn(),
    encryptPrivateKey: vi.fn()
  }
}))

vi.mock('$src/services/ErrorService', () => ({
  errorService: {
    reportError: vi.fn()
  }
}))

vi.mock('$src/services/WebSocketService', () => ({
  webSocketService: {
    disconnect: vi.fn()
  }
}))

vi.mock('$src/states/UserState.svelte', () => ({
  userState: {
    reset: vi.fn()
  }
}))

vi.mock('$src/states/ChatState.svelte', () => ({
  chatState: {
    reset: vi.fn()
  }
}))

vi.mock('$src/states/ConversationState.svelte', () => ({
  conversationState: {
    reset: vi.fn()
  }
}))

vi.mock('$src/states/CallState.svelte', () => ({
  callState: {
    endCall: vi.fn()
  }
}))

vi.mock('$src/services/api', () => ({
  authenticatedPost: vi.fn(),
  unauthenticatedPost: vi.fn()
}))

vi.mock('svelte-spa-router', () => ({
  push: vi.fn()
}))

vi.mock('$src/shared/config', () => ({
  API_CONFIG: {
    baseUrl: 'http://localhost:8080/'
  }
}))

function buildAuthResponse(overrides: Partial<AuthResponse> = {}): AuthResponse {
  return {
    success: true,
    token: 'jwt-token-123',
    message: '',
    publicKey: 'pub-key-base64',
    encryptedPrivateKey: 'enc-priv-key',
    salt: 'salt-base64',
    iv: 'iv-base64',
    ...overrides
  }
}

function mockSecureStorage(): {
  saveSession: ReturnType<typeof vi.fn>
  loadSession: ReturnType<typeof vi.fn>
  clearSession: ReturnType<typeof vi.fn>
} {
  const mock = {
    saveSession: vi.fn().mockResolvedValue(undefined),
    loadSession: vi.fn().mockResolvedValue(null),
    clearSession: vi.fn().mockResolvedValue(undefined)
  }
  Object.defineProperty(window, 'secureStorage', { value: mock, writable: true })
  return mock
}

describe('AuthenticationService', () => {
  let secureStorage: ReturnType<typeof mockSecureStorage>

  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
    secureStorage = mockSecureStorage()
  })

  describe('login', () => {
    it('stores token and decrypted private key on successful login', async () => {
      const authResponse = buildAuthResponse()
      vi.mocked(api.unauthenticatedPost).mockResolvedValue({
        json: async () => authResponse
      } as Response)
      vi.mocked(encryptionService.decryptPrivateKey).mockResolvedValue('decrypted-private-key')

      await authenticationService.login('lucas@margin.chat', 'password123')

      expect(api.unauthenticatedPost).toHaveBeenCalledWith(
        { email: 'lucas@margin.chat', password: 'password123' },
        'auth/login'
      )
      expect(sessionStorage.getItem('authToken')).toBe('jwt-token-123')
      expect(sessionStorage.getItem('privateKey')).toBe('decrypted-private-key')
      expect(sessionStorage.getItem('publicKey')).toBe('pub-key-base64')
    })

    it('calls encryptionService.decryptPrivateKey with correct args', async () => {
      const authResponse = buildAuthResponse()
      vi.mocked(api.unauthenticatedPost).mockResolvedValue({
        json: async () => authResponse
      } as Response)
      vi.mocked(encryptionService.decryptPrivateKey).mockResolvedValue('decrypted')

      await authenticationService.login('lucas@margin.chat', 'mypassword')

      expect(encryptionService.decryptPrivateKey).toHaveBeenCalledWith(
        'enc-priv-key',
        'mypassword',
        'salt-base64',
        'iv-base64'
      )
    })

    it('saves session to secure storage when keepLoggedIn is true', async () => {
      const authResponse = buildAuthResponse()
      vi.mocked(api.unauthenticatedPost).mockResolvedValue({
        json: async () => authResponse
      } as Response)
      vi.mocked(encryptionService.decryptPrivateKey).mockResolvedValue('decrypted-private-key')

      await authenticationService.login('lucas@margin.chat', 'password123', true)

      expect(secureStorage.saveSession).toHaveBeenCalledWith(
        'jwt-token-123',
        'decrypted-private-key'
      )
    })

    it('does not save to secure storage when keepLoggedIn is false', async () => {
      const authResponse = buildAuthResponse()
      vi.mocked(api.unauthenticatedPost).mockResolvedValue({
        json: async () => authResponse
      } as Response)
      vi.mocked(encryptionService.decryptPrivateKey).mockResolvedValue('decrypted')

      await authenticationService.login('lucas@margin.chat', 'password123', false)

      expect(secureStorage.saveSession).not.toHaveBeenCalled()
    })

    it('throws and reports error on failed login', async () => {
      const authResponse = buildAuthResponse({ success: false, message: 'Invalid credentials' })
      vi.mocked(api.unauthenticatedPost).mockResolvedValue({
        json: async () => authResponse
      } as Response)

      await expect(authenticationService.login('lucas@margin.chat', 'wrong')).rejects.toThrow(
        'Invalid credentials'
      )

      expect(errorService.reportError).toHaveBeenCalledWith('Error login: Invalid credentials')
      expect(sessionStorage.getItem('authToken')).toBeNull()
    })

    it('skips private key decryption when encryption fields are missing', async () => {
      const authResponse = buildAuthResponse({
        encryptedPrivateKey: undefined,
        salt: undefined,
        iv: undefined
      })
      vi.mocked(api.unauthenticatedPost).mockResolvedValue({
        json: async () => authResponse
      } as Response)

      await authenticationService.login('lucas@margin.chat', 'password123')

      expect(encryptionService.decryptPrivateKey).not.toHaveBeenCalled()
      expect(sessionStorage.getItem('authToken')).toBe('jwt-token-123')
      expect(sessionStorage.getItem('privateKey')).toBeNull()
    })

    it('skips public key storage when publicKey is missing', async () => {
      const authResponse = buildAuthResponse({ publicKey: undefined })
      vi.mocked(api.unauthenticatedPost).mockResolvedValue({
        json: async () => authResponse
      } as Response)
      vi.mocked(encryptionService.decryptPrivateKey).mockResolvedValue('decrypted')

      await authenticationService.login('lucas@margin.chat', 'password123')

      expect(sessionStorage.getItem('publicKey')).toBeNull()
    })
  })

  describe('tryRestoreSession', () => {
    it('restores session from secure storage and returns true', async () => {
      secureStorage.loadSession.mockResolvedValue({
        token: 'stored-token',
        privateKey: 'stored-key'
      })

      const result = await authenticationService.tryRestoreSession()

      expect(result).toBe(true)
      expect(sessionStorage.getItem('authToken')).toBe('stored-token')
      expect(sessionStorage.getItem('privateKey')).toBe('stored-key')
    })

    it('returns false when no stored session exists', async () => {
      secureStorage.loadSession.mockResolvedValue(null)

      const result = await authenticationService.tryRestoreSession()

      expect(result).toBe(false)
      expect(sessionStorage.getItem('authToken')).toBeNull()
    })
  })

  describe('register', () => {
    it('generates keys, encrypts private key, and sends registration', async () => {
      vi.mocked(encryptionService.generateKeyPairFromPassword).mockResolvedValue({
        publicKey: 'generated-pub',
        privateKey: 'generated-priv'
      })
      vi.mocked(encryptionService.encryptPrivateKey).mockResolvedValue({
        encryptedKey: 'encrypted-priv',
        salt: 'gen-salt',
        iv: 'gen-iv'
      })

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true
      } as Response)

      const result = await authenticationService.register(
        'johndoe',
        'John Doe',
        'secret123',
        'john@test.com',
        'MARGIN-BETA-KEY'
      )

      expect(encryptionService.generateKeyPairFromPassword).toHaveBeenCalledWith('secret123')
      expect(encryptionService.encryptPrivateKey).toHaveBeenCalledWith(
        'generated-priv',
        'secret123'
      )
      expect(fetchSpy).toHaveBeenCalledWith(
        'http://localhost:8080/auth/register',
        expect.objectContaining({ method: 'POST' })
      )
      expect(result.ok).toBe(true)
      expect(sessionStorage.getItem('publicKey')).toBe('generated-pub')
      expect(sessionStorage.getItem('privateKey')).toBe('generated-priv')

      fetchSpy.mockRestore()
    })

    it('includes profile picture in form data when provided', async () => {
      vi.mocked(encryptionService.generateKeyPairFromPassword).mockResolvedValue({
        publicKey: 'pub',
        privateKey: 'priv'
      })
      vi.mocked(encryptionService.encryptPrivateKey).mockResolvedValue({
        encryptedKey: 'enc',
        salt: 's',
        iv: 'i'
      })

      let capturedBody: FormData | undefined
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
        capturedBody = init?.body as FormData
        return { ok: true } as Response
      })

      const file = new File(['avatar'], 'avatar.png', { type: 'image/png' })

      await authenticationService.register('johndoe', 'John', 'pass1234', 'j@t.com', 'KEY', file)

      expect(capturedBody?.get('profilePicture')).toBe(file)

      fetchSpy.mockRestore()
    })

    it('does not store keys on failed registration', async () => {
      vi.mocked(encryptionService.generateKeyPairFromPassword).mockResolvedValue({
        publicKey: 'pub',
        privateKey: 'priv'
      })
      vi.mocked(encryptionService.encryptPrivateKey).mockResolvedValue({
        encryptedKey: 'enc',
        salt: 's',
        iv: 'i'
      })

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: false,
        json: async () => ({ message: 'Email taken' })
      } as Response)

      await authenticationService.register('johndoe', 'John', 'pass1234', 'j@t.com', 'KEY')

      expect(sessionStorage.getItem('publicKey')).toBeNull()
      expect(sessionStorage.getItem('privateKey')).toBeNull()

      fetchSpy.mockRestore()
    })
  })

  describe('logoutUser', () => {
    it('disconnects websocket, posts logout, resets all state, and navigates to /', async () => {
      vi.mocked(api.authenticatedPost).mockResolvedValue({ ok: true } as Response)

      await authenticationService.logoutUser()

      expect(webSocketService.disconnect).toHaveBeenCalled()
      expect(api.authenticatedPost).toHaveBeenCalledWith({}, 'auth/logout')
      expect(userState.reset).toHaveBeenCalled()
      expect(chatState.reset).toHaveBeenCalled()
      expect(conversationState.reset).toHaveBeenCalled()
      expect(callState.endCall).toHaveBeenCalled()
      expect(secureStorage.clearSession).toHaveBeenCalled()
      expect(svelteRouter.push).toHaveBeenCalledWith('/')
    })

    it('reports error when logout API call fails', async () => {
      vi.mocked(api.authenticatedPost).mockResolvedValue({ ok: false } as Response)

      await authenticationService.logoutUser()

      expect(errorService.reportError).toHaveBeenCalledWith('Failed to log out.')
      expect(userState.reset).toHaveBeenCalled()
    })
  })

  describe('clearToken', () => {
    it('removes authToken from sessionStorage', () => {
      sessionStorage.setItem('authToken', 'some-token')

      authenticationService.clearToken()

      expect(sessionStorage.getItem('authToken')).toBeNull()
    })
  })
})
