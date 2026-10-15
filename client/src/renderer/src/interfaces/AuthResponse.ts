export interface AuthResponse {
  success: boolean
  message: string
  token: string
  refreshToken: string
  publicKey: string
  encryptedPrivateKey: string
  salt: string
  iv: string
}
