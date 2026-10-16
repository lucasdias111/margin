import { contextBridge, ipcRenderer } from 'electron'
import type { ShellApi, ShellState } from '../common/shell'

// Preload for the shell's own UI: the tab bar and the add-server, settings, picker and offline
// screens. It never runs in a server tab.

const api: ShellApi = {
  getState: () => ipcRenderer.invoke('shell:get-state'),
  onState: (callback) => {
    ipcRenderer.on('shell:state', (_event, state: ShellState) => callback(state))
  },
  addServer: (url) => ipcRenderer.invoke('shell:add-server', url),
  removeServer: (id) => ipcRenderer.invoke('shell:remove-server', id),
  selectTab: (id) => ipcRenderer.send('shell:select-tab', id),
  reloadTab: (id) => ipcRenderer.send('shell:reload-tab', id),
  setOverlay: (open) => ipcRenderer.send('shell:set-overlay', open),
  chooseSource: (id) => ipcRenderer.send('shell:choose-source', id),
  dismissLink: () => ipcRenderer.send('shell:dismiss-link'),
  acceptUpdate: () => ipcRenderer.send('shell:update-accept'),
  installUpdate: () => ipcRenderer.send('shell:update-install'),
  dismissUpdate: () => ipcRenderer.send('shell:update-dismiss'),
  minimize: () => ipcRenderer.send('shell:minimize'),
  toggleMaximize: () => ipcRenderer.send('shell:toggle-maximize'),
  close: () => ipcRenderer.send('shell:close')
}

contextBridge.exposeInMainWorld('shell', api)
