/// <reference types="svelte" />
/// <reference types="vite/client" />
interface Window {
  secureStorage: {
    saveSession(token: string, privateKey: string): Promise<void>
    loadSession(): Promise<{ token: string; privateKey: string } | null>
    clearSession(): Promise<void>
  }
}
