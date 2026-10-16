import { contextBridge, ipcRenderer } from 'electron'

// Preload for a server tab. `window.marginDesktop` is exposed only when the page is the tab's
// own server, so a page the tab was somehow steered to never gets the bridge. Capabilities are
// additive within 1.x: the web app checks each one and falls back to browser behaviour.

type Presence = 'active' | 'idle' | 'away'

interface StoredSession {
  token: string
  refreshToken: string | null
  privateKey: string
}

function argument(name: string): string | undefined {
  const prefix = `--${name}=`
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length)
}

function serverFromArguments(): { origin: string; name: string } | null {
  try {
    const parsed = JSON.parse(decodeURIComponent(argument('margin-server') ?? ''))
    return typeof parsed?.origin === 'string' && typeof parsed?.name === 'string' ? parsed : null
  } catch {
    return null
  }
}

const server = serverFromArguments()

if (server && window.location.origin === server.origin) {
  contextBridge.exposeInMainWorld('marginDesktop', {
    shellVersion: argument('margin-shell-version') ?? '0.0.0',
    capabilities: ['badge', 'presence', 'secureStorage'],
    setBadgeCount: (count: number) => ipcRenderer.send('margin:badge', count),
    onPresence: (callback: (presence: Presence) => void) => {
      ipcRenderer.on('margin:presence', (_event, presence: Presence) => callback(presence))
    },
    secureStorage: {
      save: (session: StoredSession): Promise<void> =>
        ipcRenderer.invoke('margin:secure-save', {
          token: session.token,
          refreshToken: session.refreshToken,
          privateKey: session.privateKey
        }),
      load: (): Promise<StoredSession | null> => ipcRenderer.invoke('margin:secure-load'),
      clear: (): Promise<void> => ipcRenderer.invoke('margin:secure-clear')
    }
  })

  // The page uses the standard Notification API. The shell names the server in each one and
  // brings this tab forward when it's clicked.
  contextBridge.executeInMainWorld({
    func: (serverName: string, focusTab: () => void) => {
      const Native = window.Notification
      if (!Native) return
      class ShellNotification extends Native {
        constructor(title: string, options?: NotificationOptions) {
          super(`${serverName} · ${title}`, options)
          this.addEventListener('click', () => focusTab())
        }
      }
      Object.defineProperty(window, 'Notification', {
        value: ShellNotification,
        writable: true,
        configurable: true
      })
    },
    args: [server.name, () => ipcRenderer.send('margin:notification-click')]
  })
}
