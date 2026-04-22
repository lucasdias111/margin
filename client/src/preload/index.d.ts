import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      minimizeWindow: () => void
      maximizeWindow: () => void
      closeWindow: () => void
      openExternal: (url: string) => Promise<void>
      setBadgeCount: (count: number) => void
      setAppIcon: (dataUrl: string | null) => void
    }
  }
}
