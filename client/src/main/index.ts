import { app, BrowserWindow, desktopCapturer, ipcMain, nativeImage, safeStorage, session, shell } from 'electron'
import { join } from 'path'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import notificationBadge from '../../resources/notification-badge.png?asset'
import { API_CONFIG } from '../renderer/src/shared/config'
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'fs'
import pkg from 'electron-updater'

const { autoUpdater } = pkg
const SECURE_FILE = join(app.getPath('userData'), 'secure.bin')
const TOKEN_FILE = join(app.getPath('userData'), 'session.bin')

const badgeImage = nativeImage.createFromPath(notificationBadge)

ipcMain.on('set-badge-count', (_event, count: number) => {
  if (process.platform === 'darwin') {
    app.dock?.setBadge(count > 0 ? String(count) : '')
  } else if (process.platform === 'linux') {
    app.setBadgeCount(count)
  } else if (process.platform === 'win32') {
    const win = BrowserWindow.getAllWindows()[0]
    if (!win) return
    if (count > 0) {
      win.setOverlayIcon(badgeImage, `${count} unread messages`)
    } else {
      win.setOverlayIcon(null, '')
    }
  }
})

function writeEncrypted(filePath: string, plaintext: string): void {
  const encrypted = safeStorage.encryptString(plaintext)
  writeFileSync(filePath, encrypted)
}

function readEncrypted(filePath: string): string | null {
  if (!existsSync(filePath)) return null
  const encrypted = readFileSync(filePath)
  return safeStorage.decryptString(encrypted)
}

function checkForUpdates(): void {
  autoUpdater.autoDownload = false
  console.log('autoDownload set to:', autoUpdater.autoDownload)
  autoUpdater.autoInstallOnAppQuit = false
  autoUpdater.disableDifferentialDownload = true

  autoUpdater.checkForUpdates().catch((err) => console.log('Update check failed:', err))

  autoUpdater.on('update-available', (info) => {
    BrowserWindow.getAllWindows()[0]?.webContents.send('update-available', info.version)
  })

  ipcMain.on('update-accept', () => {
    autoUpdater.downloadUpdate()
  })

  ipcMain.on('update-decline', () => {
    // user said no, do nothing
  })

  autoUpdater.on('update-downloaded', () => {
    BrowserWindow.getAllWindows()[0]?.webContents.send('update-downloaded')
  })

  autoUpdater.on('error', (err) => {
    console.error('AutoUpdater error:', err)
  })

  ipcMain.on('update-install', () => {
    console.log('update-install received')

    if (process.platform === 'darwin') {
      app.removeAllListeners('window-all-closed')

      BrowserWindow.getAllWindows().forEach((w) => w.destroy())

      setTimeout(() => {
        autoUpdater.quitAndInstall(false, true)
        setTimeout(() => app.exit(0), 2000)
      }, 100)
    } else {
      autoUpdater.quitAndInstall(false, true)
    }
  })
}

ipcMain.handle('secure:saveSession', (_event, token: string, privateKey: string) => {
  writeEncrypted(TOKEN_FILE, token)
  writeEncrypted(SECURE_FILE, privateKey)
})

ipcMain.handle('secure:loadSession', () => {
  const token = readEncrypted(TOKEN_FILE)
  const privateKey = readEncrypted(SECURE_FILE)
  if (!token || !privateKey) return null
  return { token, privateKey }
})

ipcMain.handle('secure:clearSession', () => {
  if (existsSync(TOKEN_FILE)) unlinkSync(TOKEN_FILE)
  if (existsSync(SECURE_FILE)) unlinkSync(SECURE_FILE)
})

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 1000,
    minWidth: 1000,
    minHeight: 800,
    show: false,
    frame: false,
    titleBarStyle: 'hidden',
    transparent: false,
    hasShadow: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.cjs'),
      sandbox: false
    }
  })

  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: ${API_CONFIG.baseUrl} https://hel1.your-objectstorage.com; connect-src 'self' ${API_CONFIG.baseUrl} ${API_CONFIG.wsUrl} ${API_CONFIG.sfuUrl}`
        ]
      }
    })
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.on('before-input-event', (_event, input) => {
    if (input.control && input.shift && input.key === 'I') {
      mainWindow.webContents.toggleDevTools()
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  ipcMain.on('window-minimize', () => {
    mainWindow.minimize()
  })

  ipcMain.on('window-maximize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }
  })

  ipcMain.on('window-close', () => {
    mainWindow.close()
  })

  ipcMain.on('renderer-ready', () => {
    if (!is.dev) {
      checkForUpdates()
    }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  session.defaultSession.setDisplayMediaRequestHandler(async (_request, callback) => {
    const sources = await desktopCapturer.getSources({ types: ['screen'] })
    callback({ video: sources[0], audio: 'loopback' })
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
