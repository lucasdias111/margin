import { contextBridge, ipcRenderer, shell } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close')
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('secureStorage', {
      saveSession: (token: string, privateKey: string) =>
        ipcRenderer.invoke('secure:saveSession', token, privateKey),
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
      acceptUpdate: () => ipcRenderer.send('update-accept'),
      declineUpdate: () => ipcRenderer.send('update-decline'),
      installUpdate: () => ipcRenderer.send('update-install')
    })
    contextBridge.exposeInMainWorld('shell', {
      openExternal: (url) => shell.openExternal(url)
    })
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
