import { beforeEach, describe, expect, it, vi } from 'vitest'
import { encryptionService } from '../EncryptionService'
import * as api from '$src/services/api'

vi.mock('$src/services/api', () => ({
  authenticatedGet: vi.fn()
}))

describe('EncryptionService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
    encryptionService.clearCache()
  })

  describe('getPublicKey', () => {
    it('fetches and returns public key for a user', async () => {
      vi.mocked(api.authenticatedGet).mockResolvedValue({
        ok: true,
        json: async () => ({ publicKey: 'user-pub-key-base64' })
      } as Response)

      const result = await encryptionService.getPublicKey(42)

      expect(api.authenticatedGet).toHaveBeenCalledWith('users/42/public-key')
      expect(result).toBe('user-pub-key-base64')
    })

    it('throws when API response is not ok', async () => {
      vi.mocked(api.authenticatedGet).mockResolvedValue({
        ok: false
      } as Response)

      await expect(encryptionService.getPublicKey(42)).rejects.toThrow('Failed to fetch public key')
    })
  })

  describe('generateKeyPairFromPassword', () => {
    it('returns a public and private key pair', async () => {
      const result = await encryptionService.generateKeyPairFromPassword('test-password')

      expect(result.publicKey).toBeDefined()
      expect(result.publicKey.length).toBeGreaterThan(0)
      expect(result.privateKey).toBeDefined()
      expect(result.privateKey.length).toBeGreaterThan(0)
    })

    it('returns base64-encoded strings', async () => {
      const result = await encryptionService.generateKeyPairFromPassword('test-password')

      expect(() => atob(result.publicKey)).not.toThrow()
      expect(() => atob(result.privateKey)).not.toThrow()
    })
  })

  describe('encryptPrivateKey / decryptPrivateKey', () => {
    it('round-trips: encrypting then decrypting returns the original key', async () => {
      const originalKey = 'my-secret-private-key-data'
      const password = 'strong-password-123'

      const { encryptedKey, salt, iv } = await encryptionService.encryptPrivateKey(
        originalKey,
        password
      )

      expect(encryptedKey).toBeDefined()
      expect(salt).toBeDefined()
      expect(iv).toBeDefined()

      const decrypted = await encryptionService.decryptPrivateKey(encryptedKey, password, salt, iv)

      expect(decrypted).toBe(originalKey)
    })

    it('fails to decrypt with wrong password', async () => {
      const { encryptedKey, salt, iv } = await encryptionService.encryptPrivateKey(
        'secret-key',
        'correct-password'
      )

      await expect(
        encryptionService.decryptPrivateKey(encryptedKey, 'wrong-password', salt, iv)
      ).rejects.toThrow()
    })

    it('returns base64-encoded values from encryption', async () => {
      const { encryptedKey, salt, iv } = await encryptionService.encryptPrivateKey(
        'key-data',
        'password'
      )

      expect(() => atob(encryptedKey)).not.toThrow()
      expect(() => atob(salt)).not.toThrow()
      expect(() => atob(iv)).not.toThrow()
    })
  })

  describe('encryptMessage / decryptMessage', () => {
    it('round-trips: recipient can decrypt a message', async () => {
      const { publicKey: recipientPub, privateKey: recipientPriv } =
        await encryptionService.generateKeyPairFromPassword('recipient-pass')
      const { publicKey: senderPub } =
        await encryptionService.generateKeyPairFromPassword('sender-pass')

      const encrypted = await encryptionService.encryptMessage(
        'Hello Kasper!',
        recipientPub,
        senderPub
      )

      sessionStorage.setItem('privateKey', recipientPriv)

      const decrypted = await encryptionService.decryptMessage(encrypted, true)

      expect(decrypted).toBe('Hello Kasper!')
    })

    it('round-trips: sender can decrypt their own message', async () => {
      const { publicKey: recipientPub } =
        await encryptionService.generateKeyPairFromPassword('recipient-pass')
      const { publicKey: senderPub, privateKey: senderPriv } =
        await encryptionService.generateKeyPairFromPassword('sender-pass')

      const encrypted = await encryptionService.encryptMessage(
        'Hello from me',
        recipientPub,
        senderPub
      )

      sessionStorage.setItem('privateKey', senderPriv)

      const decrypted = await encryptionService.decryptMessage(encrypted, false)

      expect(decrypted).toBe('Hello from me')
    })

    it('throws when no private key is stored', async () => {
      await expect(encryptionService.decryptMessage('some-payload', true)).rejects.toThrow(
        'No private key available'
      )
    })

    it('produces a base64-encoded payload', async () => {
      const { publicKey: pub1 } = await encryptionService.generateKeyPairFromPassword('pass1')
      const { publicKey: pub2 } = await encryptionService.generateKeyPairFromPassword('pass2')

      const encrypted = await encryptionService.encryptMessage('test', pub1, pub2)

      expect(() => atob(encrypted)).not.toThrow()
      const parsed = JSON.parse(atob(encrypted))
      expect(parsed).toHaveProperty('iv')
      expect(parsed).toHaveProperty('message')
      expect(parsed).toHaveProperty('recipientKey')
      expect(parsed).toHaveProperty('senderKey')
    })
  })

  describe('importPublicKey', () => {
    it('imports a valid base64 public key as CryptoKey', async () => {
      const { publicKey } = await encryptionService.generateKeyPairFromPassword('test')

      const cryptoKey = await encryptionService.importPublicKey(publicKey)

      expect(cryptoKey).toBeDefined()
      expect(cryptoKey.type).toBe('public')
      expect(cryptoKey.algorithm).toMatchObject({ name: 'RSA-OAEP' })
      expect(cryptoKey.usages).toContain('encrypt')
    })
  })

  describe('importPrivateKey', () => {
    it('imports a valid base64 private key as CryptoKey', async () => {
      const { privateKey } = await encryptionService.generateKeyPairFromPassword('test')

      const cryptoKey = await encryptionService.importPrivateKey(privateKey)

      expect(cryptoKey).toBeDefined()
      expect(cryptoKey.type).toBe('private')
      expect(cryptoKey.algorithm).toMatchObject({ name: 'RSA-OAEP' })
      expect(cryptoKey.usages).toContain('decrypt')
    })
  })

  describe('getStoredPrivateKey', () => {
    it('returns the stored private key from sessionStorage', () => {
      sessionStorage.setItem('privateKey', 'stored-key-123')

      expect(encryptionService.getStoredPrivateKey()).toBe('stored-key-123')
    })

    it('returns null when no key is stored', () => {
      expect(encryptionService.getStoredPrivateKey()).toBeNull()
    })
  })
})
