import { authenticatedGet } from './api'

class EncryptionService {
  async getPublicKey(userId: number): Promise<string> {
    const response = await authenticatedGet(`api/users/${userId}/public-key`)

    if (!response.ok) {
      throw new Error('Failed to fetch public key')
    }

    const data = await response.json()
    return data.publicKey
  }

  async generateKeyPairFromPassword(
    password: string
  ): Promise<{ publicKey: string; privateKey: string }> {
    const encoder = new TextEncoder()
    const passwordData = encoder.encode(password)

    const seedBuffer = await crypto.subtle.digest('SHA-256', passwordData)
    const seed = new Uint8Array(seedBuffer)

    const baseKey = await crypto.subtle.importKey('raw', passwordData, 'PBKDF2', false, [
      'deriveBits'
    ])

    await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: seed,
        iterations: 100000,
        hash: 'SHA-256'
      },
      baseKey,
      256
    )

    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256'
      },
      true,
      ['encrypt', 'decrypt']
    )

    const publicKeyExport = await crypto.subtle.exportKey('spki', keyPair.publicKey)
    const privateKeyExport = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey)

    const publicKey = btoa(String.fromCharCode(...new Uint8Array(publicKeyExport)))
    const privateKey = btoa(String.fromCharCode(...new Uint8Array(privateKeyExport)))

    return { publicKey, privateKey }
  }

  async encryptPrivateKey(
    privateKey: string,
    password: string
  ): Promise<{ encryptedKey: string; salt: string; iv: string }> {
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const iv = crypto.getRandomValues(new Uint8Array(12))

    const encoder = new TextEncoder()
    const passwordData = encoder.encode(password)

    const baseKey = await crypto.subtle.importKey('raw', passwordData, 'PBKDF2', false, [
      'deriveKey'
    ])

    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    )

    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      derivedKey,
      encoder.encode(privateKey)
    )

    return {
      encryptedKey: btoa(String.fromCharCode(...new Uint8Array(encryptedData))),
      salt: btoa(String.fromCharCode(...salt)),
      iv: btoa(String.fromCharCode(...iv))
    }
  }

  async decryptPrivateKey(
    encryptedKey: string,
    password: string,
    salt: string,
    iv: string
  ): Promise<string> {
    const saltBytes = Uint8Array.from(atob(salt), (c) => c.charCodeAt(0))
    const ivBytes = Uint8Array.from(atob(iv), (c) => c.charCodeAt(0))
    const encryptedBytes = Uint8Array.from(atob(encryptedKey), (c) => c.charCodeAt(0))

    const encoder = new TextEncoder()
    const passwordData = encoder.encode(password)

    const baseKey = await crypto.subtle.importKey('raw', passwordData, 'PBKDF2', false, [
      'deriveKey'
    ])

    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltBytes,
        iterations: 100000,
        hash: 'SHA-256'
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    )

    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivBytes },
      derivedKey,
      encryptedBytes
    )

    const decoder = new TextDecoder()
    return decoder.decode(decryptedData)
  }

  async importPublicKey(keyData: string): Promise<CryptoKey> {
    const binaryKey = Uint8Array.from(atob(keyData), (c) => c.charCodeAt(0))
    return crypto.subtle.importKey('spki', binaryKey, { name: 'RSA-OAEP', hash: 'SHA-256' }, true, [
      'encrypt'
    ])
  }

  async importPrivateKey(keyData: string): Promise<CryptoKey> {
    const binaryKey = Uint8Array.from(atob(keyData), (c) => c.charCodeAt(0))
    return crypto.subtle.importKey(
      'pkcs8',
      binaryKey,
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      true,
      ['decrypt']
    )
  }

  async encryptMessage(
    message: string,
    recipientPublicKeyPem: string,
    senderPublicKeyPem: string
  ): Promise<string> {
    const aesKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, [
      'encrypt',
      'decrypt'
    ])

    const encoder = new TextEncoder()
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const encryptedMessage = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      aesKey,
      encoder.encode(message)
    )

    const exportedKey = await crypto.subtle.exportKey('raw', aesKey)

    const recipientPublicKey = await this.importPublicKey(recipientPublicKeyPem)
    const encryptedKeyForRecipient = await crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      recipientPublicKey,
      exportedKey
    )

    const senderPublicKey = await this.importPublicKey(senderPublicKeyPem)
    const encryptedKeyForSender = await crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      senderPublicKey,
      exportedKey
    )

    const payload = {
      iv: btoa(String.fromCharCode(...iv)),
      message: btoa(String.fromCharCode(...new Uint8Array(encryptedMessage))),
      recipientKey: btoa(String.fromCharCode(...new Uint8Array(encryptedKeyForRecipient))),
      senderKey: btoa(String.fromCharCode(...new Uint8Array(encryptedKeyForSender)))
    }

    return btoa(JSON.stringify(payload))
  }

  async decryptMessage(encryptedPayload: string, isRecipient: boolean): Promise<string> {
    const privateKeyPem = this.getStoredPrivateKey()
    if (!privateKeyPem) {
      throw new Error('No private key available')
    }

    const payload = JSON.parse(atob(encryptedPayload))
    const iv = Uint8Array.from(atob(payload.iv), (c) => c.charCodeAt(0))
    const encryptedMessage = Uint8Array.from(atob(payload.message), (c) => c.charCodeAt(0))

    const encryptedKeyBytes = Uint8Array.from(
      atob(isRecipient ? payload.recipientKey : payload.senderKey),
      (c) => c.charCodeAt(0)
    )

    const privateKey = await this.importPrivateKey(privateKeyPem)
    const aesKeyBytes = await crypto.subtle.decrypt(
      { name: 'RSA-OAEP' },
      privateKey,
      encryptedKeyBytes
    )

    const aesKey = await crypto.subtle.importKey('raw', aesKeyBytes, { name: 'AES-GCM' }, false, [
      'decrypt'
    ])

    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      aesKey,
      encryptedMessage
    )

    const decoder = new TextDecoder()
    return decoder.decode(decryptedData)
  }

  getStoredPrivateKey(): string | null {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('privateKey')
    }
    return null
  }
}

export const encryptionService = new EncryptionService()
