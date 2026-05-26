import { beforeEach, describe, expect, it, vi } from 'vitest'
import { authenticationService } from '../AuthenticationService'
import { encryptionService } from '$src/services/EncryptionService'
import { errorService } from '$src/services/ErrorService'
import { webSocketService } from '$src/services/WebSocketService'
import { usersState } from '$src/states/UsersState.svelte.js'
import { callState } from '$src/states/CallState.svelte'
import * as api from '$src/services/api'
import * as svelteRouter from 'svelte-spa-router'
import type { AuthResponse } from '$src/interfaces/AuthResponse'
import { navigationService } from '$src/services/NavigationService'

vi.mock('$src/services/EncryptionService', () => ({
  encryptionService: {
    decryptPrivateKey: vi.fn(),
    generateKeyPair: vi.fn(),
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

vi.mock('$src/states/UsersState.svelte.js', () => ({
  usersState: {
    reset: vi.fn()
  }
}))

vi.mock('$src/services/NavigationService', () => ({
  navigationService: {
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
  authenticatedPut: vi.fn(),
  setUnauthenticatedHandler: vi.fn(),
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

    it('regenerates and uploads encryption keys when fields are missing', async () => {
      const authResponse = buildAuthResponse({
        publicKey: undefined,
        encryptedPrivateKey: undefined,
        salt: undefined,
        iv: undefined
      })
      vi.mocked(api.unauthenticatedPost).mockResolvedValue({
        json: async () => authResponse
      } as Response)
      vi.mocked(encryptionService.generateKeyPair).mockResolvedValue({
        publicKey: 'new-pub-key',
        privateKey: 'new-priv-key'
      })
      vi.mocked(encryptionService.encryptPrivateKey).mockResolvedValue({
        encryptedKey: 'new-enc-priv-key',
        salt: 'new-salt',
        iv: 'new-iv'
      })
      vi.mocked(api.authenticatedPut).mockResolvedValue({ ok: true } as Response)

      await authenticationService.login('lucas@margin.chat', 'password123')

      expect(encryptionService.decryptPrivateKey).not.toHaveBeenCalled()
      expect(encryptionService.generateKeyPair).toHaveBeenCalled()
      expect(encryptionService.encryptPrivateKey).toHaveBeenCalledWith('new-priv-key', 'password123')
      expect(api.authenticatedPut).toHaveBeenCalledWith(
        {
          publicKey: 'new-pub-key',
          encryptedPrivateKey: 'new-enc-priv-key',
          salt: 'new-salt',
          iv: 'new-iv'
        },
        'auth/encryption-keys'
      )
      expect(sessionStorage.getItem('authToken')).toBe('jwt-token-123')
      expect(sessionStorage.getItem('privateKey')).toBe('new-priv-key')
      expect(sessionStorage.getItem('publicKey')).toBe('new-pub-key')
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
      vi.mocked(encryptionService.generateKeyPair).mockResolvedValue({
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
        'john@test.com'
      )

      expect(encryptionService.generateKeyPair).toHaveBeenCalled()
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
      vi.mocked(encryptionService.generateKeyPair).mockResolvedValue({
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

      await authenticationService.register('johndoe', 'John', 'pass1234', 'j@t.com', file)

      expect(capturedBody?.get('profilePicture')).toBe(file)

      fetchSpy.mockRestore()
    })

    it('does not store keys on failed registration', async () => {
      vi.mocked(encryptionService.generateKeyPair).mockResolvedValue({
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

      await authenticationService.register('johndoe', 'John', 'pass1234', 'j@t.com')

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
      expect(usersState.reset).toHaveBeenCalled()
      expect(navigationService.reset).toHaveBeenCalled()
      expect(callState.endCall).toHaveBeenCalled()
      expect(secureStorage.clearSession).toHaveBeenCalled()
      expect(svelteRouter.push).toHaveBeenCalledWith('/')
    })

    it('reports error when logout API call fails', async () => {
      vi.mocked(api.authenticatedPost).mockResolvedValue({ ok: false } as Response)

      await authenticationService.logoutUser()

      expect(errorService.reportError).toHaveBeenCalledWith('Failed to log out.')
      expect(usersState.reset).toHaveBeenCalled()
    })
  })

  describe('clearToken', () => {
    it('removes authToken from sessionStorage', () => {
      sessionStorage.setItem('authToken', 'some-token')

      authenticationService.clearToken()

      expect(sessionStorage.getItem('authToken')).toBeNull()
    })
  })

  describe('forgotPassword', () => {
    it('calls unauthenticatedPost with email and correct endpoint', async () => {
      vi.mocked(api.unauthenticatedPost).mockResolvedValue({ ok: true } as Response)

      await authenticationService.forgotPassword('alice@margin.chat')

      expect(api.unauthenticatedPost).toHaveBeenCalledWith(
        { email: 'alice@margin.chat' },
        'auth/forgot-password'
      )
    })

    it('resolves without throwing on ok response', async () => {
      vi.mocked(api.unauthenticatedPost).mockResolvedValue({ ok: true } as Response)

      await expect(authenticationService.forgotPassword('alice@margin.chat')).resolves.toBeUndefined()
    })

    it('throws on non-ok response', async () => {
      vi.mocked(api.unauthenticatedPost).mockResolvedValue({ ok: false } as Response)

      await expect(authenticationService.forgotPassword('alice@margin.chat')).rejects.toThrow(
        'Request failed'
      )
    })
  })
})
