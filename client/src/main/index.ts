import { app, BrowserWindow, desktopCapturer, ipcMain, nativeImage, safeStorage, session, shell } from 'electron'
import { join } from 'path'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import notificationBadge from '../../resources/notification-badge.png?asset'
import { API_CONFIG } from '../renderer/src/shared/config'
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'fs'
import pkg from 'electron-updater'
import { setupPresence } from './presence'

const { autoUpdater } = pkg
const SECURE_FILE = join(app.getPath('userData'), 'secure.bin')
const TOKEN_FILE = join(app.getPath('userData'), 'session.bin')

const badgeImage = nativeImage.createFromPath(notificationBadge)

function logUpdater(...args: unknown[]): void {
  console.log('[updater]', ...args)
}

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

ipcMain.handle('open-external', (_event, url: string) => {
  try {
    const { protocol } = new URL(url)
    if (protocol === 'http:' || protocol === 'https:' || protocol === 'mailto:') {
      return shell.openExternal(url)
    }
  } catch {
    // invalid URL — ignore
  }
  return undefined
})

let squirrelReady = false
let installConfirmed = false

function doQuitAndInstall(): void {
  logUpdater('Calling quitAndInstall (macOS)')
  app.removeAllListeners('window-all-closed')
  autoUpdater.quitAndInstall(false, true)
  setTimeout(() => {
    logUpdater('quitAndInstall did not exit after 15s — forcing app.exit(0)')
    app.exit(0)
  }, 15000)
}

ipcMain.on('update-accept', () => {
  logUpdater('User accepted update — starting download')
  autoUpdater.downloadUpdate().catch((err) => logUpdater('downloadUpdate error:', err))
})

ipcMain.on('update-decline', () => {
  logUpdater('User declined update')
})

ipcMain.on('update-install', () => {
  logUpdater('update-install received — platform:', process.platform)

  if (process.platform === 'darwin') {
    installConfirmed = true
    if (squirrelReady) {
      logUpdater('Squirrel already ready — installing now')
      doQuitAndInstall()
    } else {
      logUpdater('Squirrel not ready yet — will install once it signals ready')
    }
  } else {
    logUpdater('Calling quitAndInstall (non-macOS)')
    autoUpdater.quitAndInstall(false, true)
  }
})

autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = false

autoUpdater.logger = {
  info: (...args: unknown[]) => logUpdater('ℹ', ...args),
  warn: (...args: unknown[]) => logUpdater('⚠', ...args),
  error: (...args: unknown[]) => logUpdater('✖', ...args),
  debug: (...args: unknown[]) => logUpdater('·', ...args)
} as any

autoUpdater.on('checking-for-update', () => {
  logUpdater('Checking for update…')
})

autoUpdater.on('update-available', (info) => {
  logUpdater('Update available:', info.version, '| releaseName:', info.releaseName)
  logUpdater('Release date:', info.releaseDate)
  BrowserWindow.getAllWindows()[0]?.webContents.send('update-available', info.version)
})

autoUpdater.on('update-not-available', (info) => {
  logUpdater('No update available. Current version is latest:', info.version)
})

autoUpdater.on('download-progress', (progress) => {
  logUpdater(
    `Download progress: ${progress.percent.toFixed(1)}%`,
    `| speed: ${(progress.bytesPerSecond / 1024).toFixed(1)} KB/s`,
    `| transferred: ${(progress.transferred / 1024 / 1024).toFixed(2)} MB`,
    `/ ${(progress.total / 1024 / 1024).toFixed(2)} MB`
  )
  BrowserWindow.getAllWindows()[0]?.webContents.send('update-progress', progress.percent)
})

autoUpdater.on('update-downloaded', (info) => {
  logUpdater('Update downloaded:', info.version)
  logUpdater('Download path:', (info as any).downloadedFile ?? 'unknown')

  BrowserWindow.getAllWindows()[0]?.webContents.send('update-downloaded')

  if (process.platform === 'darwin') {
    squirrelReady = true
    logUpdater('Squirrel ready. installConfirmed:', installConfirmed)
    if (installConfirmed) {
      logUpdater('User already confirmed — installing now')
      doQuitAndInstall()
    } else {
      logUpdater('Waiting for user to confirm install…')
    }
  }
})

autoUpdater.on('error', (err) => {
  logUpdater('AutoUpdater error:', err?.message ?? err)
  logUpdater('Stack:', err?.stack)
  BrowserWindow.getAllWindows()[0]?.webContents.send('update-error', err?.message ?? String(err))
})

function checkForUpdates(): void {
  logUpdater('checkForUpdates called')
  logUpdater('app version:', app.getVersion())
  logUpdater('platform:', process.platform, process.arch)
  logUpdater('userData (update cache lives here):', app.getPath('userData'))

  autoUpdater.checkForUpdates().catch((err) => {
    logUpdater('checkForUpdates() rejected:', err?.message ?? err)
  })
}

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 1000,
    minWidth: 1000,
    minHeight: 800,
    show: false,
    frame: false,
    titleBarStyle: 'hidden',
    ...(process.platform === 'darwin' ? { trafficLightPosition: { x: 12, y: 10 } } : {}),
    transparent: process.platform !== 'linux',
    hasShadow: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.cjs'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  setupPresence(mainWindow)

  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: ${API_CONFIG.baseUrl} ${API_CONFIG.s3Url} ${API_CONFIG.cdnUrl} https://static.klipy.com; connect-src 'self' ${API_CONFIG.baseUrl} ${API_CONFIG.wsUrl} ${API_CONFIG.sfuUrl} ${API_CONFIG.s3Url} https://api.klipy.com`
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
    try {
      const { protocol } = new URL(details.url)
      if (protocol === 'http:' || protocol === 'https:' || protocol === 'mailto:') {
        shell.openExternal(details.url)
      }
    } catch {
      // invalid URL — deny silently
    }
    return { action: 'deny' }
  })

  ipcMain.on('window-minimize', () => mainWindow.minimize())

  ipcMain.on('window-maximize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }
  })

  ipcMain.on('window-close', () => mainWindow.close())

  ipcMain.on('renderer-ready', () => {
    logUpdater('renderer-ready received')
    if (!is.dev) {
      checkForUpdates()
    } else {
      logUpdater('Skipping update check in dev mode')
    }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  session.defaultSession.setDisplayMediaRequestHandler(async (_request, callback) => {
    const sources = await desktopCapturer.getSources({ types: ['screen'] })
    callback({ video: sources[0], audio: 'loopback' })
  })

  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
