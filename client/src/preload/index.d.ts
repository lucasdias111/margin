declare global {
  interface Window {
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
