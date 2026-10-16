import { app, BrowserWindow, Menu, type MenuItemConstructorOptions } from 'electron'
import { resolve } from 'path'
import { electronApp, is } from '@electron-toolkit/utils'
import { Shell } from './shell'

// The desktop app is a thin shell: a tab per margin server, each loading that server's own
// web app. It ships no chat UI of its own.

// Dev builds keep their servers and sessions apart from the installed app's.
if (is.dev) app.setPath('userData', app.getPath('userData') + '-dev')

const PROTOCOL = 'margin'

let shell: Shell | null = null
let launchLink: string | undefined

function deepLinkFromArgv(argv: string[]): string | undefined {
  return argv.find((arg) => arg.startsWith(`${PROTOCOL}://`))
}

function buildMenu(target: Shell): void {
  const isMac = process.platform === 'darwin'
  const tabItems: MenuItemConstructorOptions[] = Array.from({ length: 9 }, (_, index) => ({
    label: `Server ${index + 1}`,
    accelerator: `CmdOrCtrl+${index + 1}`,
    visible: false,
    click: () => target.selectByIndex(index)
  }))

  const template: MenuItemConstructorOptions[] = [
    ...(isMac ? [{ role: 'appMenu' as const }] : []),
    { role: 'editMenu' },
    {
      label: 'View',
      submenu: [
        { label: 'Reload', accelerator: 'CmdOrCtrl+R', click: () => target.reloadActive() },
        {
          label: 'Toggle Developer Tools',
          accelerator: isMac ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
          click: () => target.toggleActiveDevTools()
        },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom', visible: isMac },
        { type: 'separator' },
        { label: 'Next Server', accelerator: 'Ctrl+Tab', click: () => target.selectNext(1) },
        {
          label: 'Previous Server',
          accelerator: 'Ctrl+Shift+Tab',
          click: () => target.selectNext(-1)
        },
        ...tabItems,
        ...(isMac ? [{ type: 'separator' as const }, { role: 'front' as const }] : []),
        { role: 'close' }
      ]
    }
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

// A protocol activation on Windows and Linux arrives as a second launch, so the lock and the
// handler have to ship together or the link just opens another window.
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  launchLink = deepLinkFromArgv(process.argv)

  app.on('second-instance', (_event, argv) => {
    const link = deepLinkFromArgv(argv)
    if (link) shell?.openDeepLink(link)
    else shell?.focus()
  })

  app.on('open-url', (event, url) => {
    event.preventDefault()
    if (shell?.window) shell.openDeepLink(url)
    else launchLink = url
  })

  // No page may open webviews, and nothing gets Node.
  app.on('web-contents-created', (_event, contents) => {
    contents.on('will-attach-webview', (event) => event.preventDefault())
  })

  app.whenReady().then(() => {
    electronApp.setAppUserModelId('com.margin.app')

    if (process.defaultApp) {
      if (process.argv.length >= 2) {
        app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [resolve(process.argv[1])])
      }
    } else {
      app.setAsDefaultProtocolClient(PROTOCOL)
    }

    shell = new Shell()
    buildMenu(shell)
    shell.createWindow()
    shell.start()

    if (launchLink) {
      shell.openDeepLink(launchLink)
      launchLink = undefined
    }

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) shell?.createWindow()
      else shell?.focus()
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
}
