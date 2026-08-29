/// <reference types="svelte" />
/// <reference types="vite/client" />
interface Window {
  secureStorage?: {
    saveSession(token: string, privateKey: string, refreshToken: string): Promise<void>
    loadSession(): Promise<{
      token: string
      privateKey: string
      refreshToken: string | null
    } | null>
    clearSession(): Promise<void>
  }
  updater?: {
    onUpdateAvailable: (callback: (version: string) => void) => void
    onUpdateDownloaded: (callback: () => void) => void
    onUpdateProgress: (callback: (percent: number) => void) => void
    onUpdateError: (callback: (message: string) => void) => void
    acceptUpdate: () => void
    declineUpdate: () => void
    installUpdate: () => void
    notifyReady: () => void
  }
  electronAPI?: {
    onDeepLink?: (callback: (path: string) => void) => void
    onUserStatusChange: (callback: (status: 'active' | 'away') => void) => void
  }
}
