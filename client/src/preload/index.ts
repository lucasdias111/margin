import { contextBridge, ipcRenderer } from 'electron'

const api = {
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  setBadgeCount: (count: number) => ipcRenderer.send('set-badge-count', count),
  platform: process.platform
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('secureStorage', {
      saveSession: (token: string, privateKey: string, refreshToken: string) =>
        ipcRenderer.invoke('secure:saveSession', token, privateKey, refreshToken),
      loadSession: () => ipcRenderer.invoke('secure:loadSession'),
      clearSession: () => ipcRenderer.invoke('secure:clearSession')
    })
    contextBridge.exposeInMainWorld('updater', {
      notifyReady: () => ipcRenderer.send('renderer-ready'),
      onUpdateAvailable: (callback: (version: string) => void) => {
        ipcRenderer.on('update-available', (_e, version) => callback(version))
      },
      onUpdateDownloaded: (callback: () => void) => {
        ipcRenderer.on('update-downloaded', () => callback())
      },
      onUpdateProgress: (callback: (percent: number) => void) => {
        ipcRenderer.on('update-progress', (_e, percent) => callback(percent))
      },
      onUpdateError: (callback: (message: string) => void) => {
        ipcRenderer.on('update-error', (_e, message) => callback(message))
      },
      acceptUpdate: () => ipcRenderer.send('update-accept'),
      declineUpdate: () => ipcRenderer.send('update-decline'),
      installUpdate: () => ipcRenderer.send('update-install')
    })
    contextBridge.exposeInMainWorld('electronAPI', {
      onUserStatusChange: (callback: (status: 'active' | 'idle' | 'away') => void) =>
        ipcRenderer.on('user-status', (_event, status) => callback(status))
    })
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.api = api
}
