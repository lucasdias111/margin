import { describe, it, expect, beforeEach } from 'vitest'
import { EncryptionService } from '../EncryptionService'

describe('EncryptionService group encryption', () => {
  let service: EncryptionService

  beforeEach(() => {
    service = new EncryptionService()
  })

  it('encryptMessageForGroup and decryptGroupMessage round-trip for a single member', async () => {
    const { publicKey, privateKey } = await service.generateKeyPair()

    vi.spyOn(service, 'getStoredPrivateKey').mockReturnValue(privateKey)

    const memberPublicKeys = { '42': publicKey }
    const plaintext = 'Hello, secret group!'

    const encrypted = await service.encryptMessageForGroup(plaintext, memberPublicKeys)
    const decrypted = await service.decryptGroupMessage(encrypted, 42)

    expect(decrypted).toBe(plaintext)
  })

  it('encryptMessageForGroup produces different ciphertexts for each call (random IV)', async () => {
    const { publicKey } = await service.generateKeyPair()
    const memberPublicKeys = { '1': publicKey }
    const plaintext = 'same message'

    const e1 = await service.encryptMessageForGroup(plaintext, memberPublicKeys)
    const e2 = await service.encryptMessageForGroup(plaintext, memberPublicKeys)

    expect(e1).not.toBe(e2)
  })

  it('decryptGroupMessage throws when userId has no key slot', async () => {
    const { publicKey, privateKey } = await service.generateKeyPair()
    vi.spyOn(service, 'getStoredPrivateKey').mockReturnValue(privateKey)

    const encrypted = await service.encryptMessageForGroup('hi', { '99': publicKey })

    await expect(service.decryptGroupMessage(encrypted, 1)).rejects.toThrow(
      'No key slot found for current user in group message'
    )
  })

  it('encrypted payload contains a key slot for every member', async () => {
    const kp1 = await service.generateKeyPair()
    const kp2 = await service.generateKeyPair()

    const memberPublicKeys = { '1': kp1.publicKey, '2': kp2.publicKey }
    const encrypted = await service.encryptMessageForGroup('multi-user', memberPublicKeys)

    const payload = JSON.parse(atob(encrypted))
    expect(Object.keys(payload.keys)).toContain('1')
    expect(Object.keys(payload.keys)).toContain('2')
    expect(Object.keys(payload.keys)).toHaveLength(2)
  })

  it('decryptGroupMessage fails when private key is missing', async () => {
    const { publicKey } = await service.generateKeyPair()
    vi.spyOn(service, 'getStoredPrivateKey').mockReturnValue(null)

    const encrypted = await service.encryptMessageForGroup('hi', { '1': publicKey })

    await expect(service.decryptGroupMessage(encrypted, 1)).rejects.toThrow('No private key available')
  })
})
