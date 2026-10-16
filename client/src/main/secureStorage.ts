import { safeStorage } from 'electron'
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'fs'
import { join } from 'path'
import { serverIdFor } from './servers'

// The `secureStorage` capability: one session per server origin (token, refresh token and the
// user's private key), encrypted with the OS keychain through safeStorage. The origin always
// comes from the tab that asked, never from the page.

export interface StoredSession {
  token: string
  refreshToken: string | null
  privateKey: string
}

export class SecureStorage {
  constructor(private readonly dir: string) {}

  save(origin: string, session: StoredSession): void {
    if (typeof session?.token !== 'string' || typeof session?.privateKey !== 'string') {
      throw new Error('A session needs a token and a private key.')
    }
    const plaintext = JSON.stringify({
      token: session.token,
      refreshToken: typeof session.refreshToken === 'string' ? session.refreshToken : null,
      privateKey: session.privateKey
    })
    mkdirSync(this.dir, { recursive: true })
    writeFileSync(this.fileFor(origin), safeStorage.encryptString(plaintext), { mode: 0o600 })
  }

  load(origin: string): StoredSession | null {
    const file = this.fileFor(origin)
    if (!existsSync(file)) return null
    try {
      const parsed = JSON.parse(safeStorage.decryptString(readFileSync(file)))
      if (typeof parsed?.token !== 'string' || typeof parsed?.privateKey !== 'string') return null
      return parsed as StoredSession
    } catch {
      return null
    }
  }

  clear(origin: string): void {
    const file = this.fileFor(origin)
    if (existsSync(file)) unlinkSync(file)
  }

  private fileFor(origin: string): string {
    return join(this.dir, `${serverIdFor(origin)}.bin`)
  }
}
