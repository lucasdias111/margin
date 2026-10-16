import {
  app,
  BrowserWindow,
  desktopCapturer,
  ipcMain,
  nativeTheme,
  net,
  session,
  shell,
  webContents,
  WebContentsView,
  type DesktopCapturerSource,
  type IpcMainEvent,
  type IpcMainInvokeEvent,
  type Session,
  type WebContents
} from 'electron'
import { join } from 'path'
import icon from '../../resources/icon.png?asset'
import {
  TAB_BAR_HEIGHT,
  type AddServerResult,
  type PickerSource,
  type ShellState,
  type TabState
} from '../common/shell'
import { applyBadge, totalUnread } from './badge'
import { setupPresence, type UserStatus } from './presence'
import { SecureStorage, type StoredSession } from './secureStorage'
import { ServerStore, validateServer, type Server } from './servers'
import { ShellUpdater } from './updates'
import { isExternalOpenable, isSameOrigin, originOf, parseDeepLink } from './urls'

// Permissions a server's own pages may get. Anything else, and anything asked by another
// origin, is denied.
const ALLOWED_PERMISSIONS = new Set([
  'media',
  'display-capture',
  'notifications',
  'fullscreen',
  'clipboard-sanitized-write',
  'pointerLock'
])

interface Tab {
  server: Server
  view: WebContentsView
  status: TabState['status']
  error: string | null
  unread: number
}

interface PendingPick {
  tabId: string
  sources: DesktopCapturerSource[]
  callback: (streams: Electron.Streams) => void
}

function openExternal(url: string): void {
  if (isExternalOpenable(url)) void shell.openExternal(url)
}

export class Shell {
  private win: BrowserWindow | null = null
  private readonly tabs = new Map<string, Tab>()
  private readonly tabsByContents = new Map<number, Tab>()
  private readonly preparedSessions = new WeakSet<Session>()
  private activeId: string | null = null
  private overlay = false
  private pendingLink: ShellState['pendingLink'] = null
  private pendingPick: PendingPick | null = null
  private stopPresence: (() => void) | null = null
  private readonly store: ServerStore
  private readonly secure: SecureStorage
  private readonly updater: ShellUpdater

  constructor() {
    const userData = app.getPath('userData')
    this.store = new ServerStore(join(userData, 'servers.json'))
    this.secure = new SecureStorage(join(userData, 'secure'))
    this.updater = new ShellUpdater(() => this.publish())
    this.registerIpc()
  }

  get window(): BrowserWindow | null {
    return this.win
  }

  start(): void {
    this.updater.start()
  }

  createWindow(): void {
    const isMac = process.platform === 'darwin'
    const win = new BrowserWindow({
      width: 1400,
      height: 1000,
      minWidth: 800,
      minHeight: 600,
      show: false,
      frame: isMac,
      titleBarStyle: 'hidden',
      ...(isMac ? { trafficLightPosition: { x: 14, y: 13 } } : {}),
      backgroundColor: nativeTheme.shouldUseDarkColors ? '#262626' : '#f2eee8',
      ...(process.platform === 'linux' ? { icon } : {}),
      webPreferences: {
        preload: join(__dirname, '../preload/shell.cjs'),
        sandbox: true,
        contextIsolation: true,
        nodeIntegration: false
      }
    })
    this.win = win

    // The shell UI is local and never navigates.
    win.webContents.on('will-navigate', (event) => event.preventDefault())
    win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))

    win.on('ready-to-show', () => win.show())
    win.on('resize', () => this.layout())
    win.on('maximize', () => this.publish())
    win.on('unmaximize', () => this.publish())
    win.on('focus', () => this.activeTab()?.view.webContents.focus())
    win.on('closed', () => {
      this.stopPresence?.()
      this.stopPresence = null
      this.cancelPick()
      for (const tab of this.tabs.values()) this.forget(tab)
      this.win = null
    })

    for (const server of this.store.list()) this.openTab(server)
    this.activeId = this.store.list()[0]?.id ?? null
    this.layout()

    this.stopPresence = setupPresence((status) => this.broadcastPresence(status))

    if (process.env['ELECTRON_RENDERER_URL']) {
      void win.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
      void win.loadFile(join(__dirname, '../renderer/index.html'))
    }
  }

  focus(): void {
    const win = this.win
    if (!win) return
    if (win.isMinimized()) win.restore()
    win.show()
    win.focus()
  }

  // `margin://open?url=…`: open the link in its server's tab, or offer to add that server.
  openDeepLink(link: string): void {
    const target = parseDeepLink(link)
    const origin = target ? originOf(target) : null
    if (!target || !origin) return

    this.focus()
    const server = this.store.byOrigin(origin)
    if (server) {
      this.pendingLink = null
      this.select(server.id)
      void this.tabs.get(server.id)?.view.webContents.loadURL(target)
    } else {
      this.pendingLink = { url: target, origin }
    }
    this.publish()
  }

  reloadActive(): void {
    const tab = this.activeTab()
    if (tab) this.reload(tab.server.id)
  }

  toggleActiveDevTools(): void {
    this.activeTab()?.view.webContents.toggleDevTools()
  }

  selectByIndex(index: number): void {
    const server = this.store.list()[index]
    if (server) this.select(server.id)
  }

  selectNext(step: 1 | -1): void {
    const servers = this.store.list()
    if (servers.length === 0) return
    const current = servers.findIndex((server) => server.id === this.activeId)
    this.select(servers[(current + step + servers.length) % servers.length].id)
  }

  // --- tabs -----------------------------------------------------------------------------

  private openTab(server: Server, url = `${server.origin}/`): void {
    const win = this.win
    if (!win || this.tabs.has(server.id)) return

    const partition = `persist:server-${server.id}`
    this.prepareSession(session.fromPartition(partition))

    const view = new WebContentsView({
      webPreferences: {
        partition,
        preload: join(__dirname, '../preload/server.cjs'),
        sandbox: true,
        contextIsolation: true,
        nodeIntegration: false,
        spellcheck: true,
        additionalArguments: [
          `--margin-server=${encodeURIComponent(JSON.stringify({ origin: server.origin, name: server.name }))}`,
          `--margin-shell-version=${app.getVersion()}`
        ]
      }
    })
    view.setBackgroundColor(nativeTheme.shouldUseDarkColors ? '#262626' : '#f2eee8')
    view.setVisible(false)

    const tab: Tab = { server, view, status: 'loading', error: null, unread: 0 }
    this.tabs.set(server.id, tab)
    this.tabsByContents.set(view.webContents.id, tab)
    this.watch(tab)

    win.contentView.addChildView(view)
    void view.webContents.loadURL(url)
  }

  private watch(tab: Tab): void {
    const contents = tab.view.webContents
    const { origin } = tab.server

    contents.on('will-navigate', (event) => {
      if (isSameOrigin(event.url, origin)) return
      event.preventDefault()
      openExternal(event.url)
    })
    contents.on('will-redirect', (event) => {
      if (!event.isMainFrame || isSameOrigin(event.url, origin)) return
      event.preventDefault()
      openExternal(event.url)
    })
    contents.setWindowOpenHandler(({ url }) => {
      openExternal(url)
      return { action: 'deny' }
    })

    contents.on('did-start-navigation', (details) => {
      if (!details.isMainFrame || details.isSameDocument) return
      this.setStatus(tab, 'loading', null)
    })
    contents.on('did-navigate', (_event, _url, httpResponseCode) => {
      if (httpResponseCode >= 500) {
        this.setStatus(tab, 'failed', `The server answered with HTTP ${httpResponseCode}.`)
      }
    })
    contents.on('did-fail-load', (_event, errorCode, errorDescription, _url, isMainFrame) => {
      // -3 is an aborted load, which a newer navigation replaced.
      if (!isMainFrame || errorCode === -3) return
      this.setStatus(tab, 'failed', errorDescription || `Load failed (${errorCode}).`)
    })
    contents.on('did-stop-loading', () => {
      if (tab.status === 'loading') this.setStatus(tab, 'ready', null)
    })
    contents.on('render-process-gone', (_event, details) => {
      if (details.reason === 'clean-exit') return
      this.setStatus(tab, 'failed', 'The page stopped unexpectedly.')
    })
  }

  private prepareSession(ses: Session): void {
    if (this.preparedSessions.has(ses)) return
    this.preparedSessions.add(ses)

    const tabOriginFor = (contents: WebContents | null): string | null =>
      contents ? (this.tabsByContents.get(contents.id)?.server.origin ?? null) : null

    ses.setPermissionRequestHandler((contents, permission, callback, details) => {
      const origin = tabOriginFor(contents)
      callback(
        !!origin &&
          isSameOrigin(details.requestingUrl, origin) &&
          ALLOWED_PERMISSIONS.has(permission)
      )
    })
    ses.setPermissionCheckHandler((contents, permission, requestingOrigin) => {
      const origin = tabOriginFor(contents)
      return !!origin && requestingOrigin === origin && ALLOWED_PERMISSIONS.has(permission)
    })
    ses.setDisplayMediaRequestHandler((request, callback) => {
      const contents = request.frame ? webContents.fromFrame(request.frame) : null
      const tab = contents ? this.tabsByContents.get(contents.id) : undefined
      if (!tab || !isSameOrigin(request.securityOrigin, tab.server.origin)) {
        callback({})
        return
      }
      void this.openPicker(tab, callback)
    })
  }

  private setStatus(tab: Tab, status: Tab['status'], error: string | null): void {
    if (tab.status === status && tab.error === error) return
    tab.status = status
    tab.error = error
    this.layout()
    this.publish()
  }

  private select(id: string): void {
    if (!this.tabs.has(id)) return
    this.activeId = id
    this.layout()
    this.publish()
    this.tabs.get(id)?.view.webContents.focus()
  }

  private reload(id: string): void {
    const tab = this.tabs.get(id)
    if (!tab) return
    const current = tab.view.webContents.getURL()
    const url =
      tab.status !== 'failed' && isSameOrigin(current, tab.server.origin)
        ? current
        : `${tab.server.origin}/`
    void tab.view.webContents.loadURL(url)
  }

  private async addServer(input: string): Promise<AddServerResult> {
    const result = await validateServer(input, (url, init) => net.fetch(url, init))
    if (!result.ok) return result

    const server = this.store.add(result.origin, result.instance.name)
    const link = this.pendingLink?.origin === server.origin ? this.pendingLink.url : undefined
    if (link) this.pendingLink = null

    if (this.tabs.has(server.id)) {
      if (link) void this.tabs.get(server.id)?.view.webContents.loadURL(link)
    } else {
      this.openTab(server, link)
    }
    this.select(server.id)
    return { ok: true }
  }

  private async removeServer(id: string): Promise<void> {
    const tab = this.tabs.get(id)
    const server = this.store.get(id)
    if (!server) return

    if (this.pendingPick?.tabId === id) this.cancelPick()
    this.store.remove(id)
    if (tab) {
      this.win?.contentView.removeChildView(tab.view)
      this.forget(tab)
      tab.view.webContents.close()
    }

    // Removing a server signs out of it on this computer.
    this.secure.clear(server.origin)
    await session.fromPartition(`persist:server-${server.id}`).clearStorageData()

    if (this.activeId === id) this.activeId = this.store.list()[0]?.id ?? null
    this.updateBadge()
    this.layout()
    this.publish()
  }

  private forget(tab: Tab): void {
    this.tabs.delete(tab.server.id)
    if (!tab.view.webContents.isDestroyed()) this.tabsByContents.delete(tab.view.webContents.id)
  }

  private activeTab(): Tab | undefined {
    return this.activeId ? this.tabs.get(this.activeId) : undefined
  }

  private layout(): void {
    const win = this.win
    if (!win || win.isDestroyed()) return
    const [width, height] = win.getContentSize()
    const bounds = {
      x: 0,
      y: TAB_BAR_HEIGHT,
      width,
      height: Math.max(0, height - TAB_BAR_HEIGHT)
    }
    const covered = this.overlay || this.pendingPick !== null || this.pendingLink !== null
    for (const tab of this.tabs.values()) {
      tab.view.setBounds(bounds)
      tab.view.setVisible(!covered && tab.server.id === this.activeId && tab.status !== 'failed')
    }
  }

  // --- screen-share picker --------------------------------------------------------------

  private async openPicker(tab: Tab, callback: (streams: Electron.Streams) => void): Promise<void> {
    if (this.pendingPick) {
      callback({})
      return
    }
    let sources: DesktopCapturerSource[]
    try {
      sources = await desktopCapturer.getSources({
        types: ['screen', 'window'],
        thumbnailSize: { width: 320, height: 180 }
      })
    } catch {
      callback({})
      return
    }
    const ownWindow = this.win?.getMediaSourceId()
    sources = sources.filter((source) => source.id !== ownWindow)

    this.pendingPick = { tabId: tab.server.id, sources, callback }
    this.select(tab.server.id)
    this.focus()
    this.layout()
    this.publish()
  }

  private choose(id: string | null): void {
    const pick = this.pendingPick
    if (!pick) return
    this.pendingPick = null
    const source = id ? pick.sources.find((candidate) => candidate.id === id) : undefined
    pick.callback(source ? { video: source } : {})
    this.layout()
    this.publish()
  }

  private cancelPick(): void {
    if (this.pendingPick) this.choose(null)
  }

  // --- the bridge ------------------------------------------------------------------------

  // A bridge call only counts when it comes from a server tab's main frame on that server.
  private bridgeTab(event: IpcMainEvent | IpcMainInvokeEvent): Tab | null {
    const tab = this.tabsByContents.get(event.sender.id)
    const frame = event.senderFrame
    if (!tab || !frame || frame.parent !== null) return null
    return frame.origin === tab.server.origin ? tab : null
  }

  private broadcastPresence(status: UserStatus): void {
    for (const tab of this.tabs.values()) {
      if (!tab.view.webContents.isDestroyed()) tab.view.webContents.send('margin:presence', status)
    }
  }

  private updateBadge(): void {
    applyBadge(this.win, totalUnread([...this.tabs.values()].map((tab) => tab.unread)))
  }

  private registerIpc(): void {
    ipcMain.on('margin:badge', (event, count: unknown) => {
      const tab = this.bridgeTab(event)
      if (!tab) return
      const unread = typeof count === 'number' && Number.isFinite(count) ? Math.max(0, count) : 0
      if (unread === tab.unread) return
      tab.unread = unread
      this.updateBadge()
      this.publish()
    })

    ipcMain.on('margin:notification-click', (event) => {
      const tab = this.bridgeTab(event)
      if (!tab) return
      this.focus()
      this.select(tab.server.id)
    })

    ipcMain.handle('margin:secure-save', (event, stored: StoredSession) => {
      const tab = this.bridgeTab(event)
      if (!tab) throw new Error('Not allowed')
      this.secure.save(tab.server.origin, stored)
    })
    ipcMain.handle('margin:secure-load', (event) => {
      const tab = this.bridgeTab(event)
      return tab ? this.secure.load(tab.server.origin) : null
    })
    ipcMain.handle('margin:secure-clear', (event) => {
      const tab = this.bridgeTab(event)
      if (tab) this.secure.clear(tab.server.origin)
    })

    // The shell's own UI.
    const fromShell = (event: IpcMainEvent | IpcMainInvokeEvent): boolean =>
      !!this.win && event.sender.id === this.win.webContents.id

    ipcMain.handle('shell:get-state', (event) => (fromShell(event) ? this.state() : null))
    ipcMain.handle('shell:add-server', (event, url: unknown) =>
      fromShell(event) && typeof url === 'string'
        ? this.addServer(url)
        : { ok: false, error: 'Not allowed' }
    )
    ipcMain.handle('shell:remove-server', (event, id: unknown) =>
      fromShell(event) && typeof id === 'string' ? this.removeServer(id) : undefined
    )
    const on = (channel: string, handler: (...args: unknown[]) => void): void => {
      ipcMain.on(channel, (event, ...args) => {
        if (fromShell(event)) handler(...args)
      })
    }
    on('shell:select-tab', (id) => typeof id === 'string' && this.select(id))
    on('shell:reload-tab', (id) => typeof id === 'string' && this.reload(id))
    on('shell:set-overlay', (open) => {
      this.overlay = open === true
      this.layout()
    })
    on('shell:choose-source', (id) => this.choose(typeof id === 'string' ? id : null))
    on('shell:dismiss-link', () => {
      this.pendingLink = null
      this.layout()
      this.publish()
    })
    on('shell:update-accept', () => this.updater.accept())
    on('shell:update-install', () => this.updater.install())
    on('shell:update-dismiss', () => this.updater.dismiss())
    on('shell:minimize', () => this.win?.minimize())
    on('shell:toggle-maximize', () => {
      if (!this.win) return
      if (this.win.isMaximized()) this.win.unmaximize()
      else this.win.maximize()
    })
    on('shell:close', () => this.win?.close())
  }

  private state(): ShellState {
    const picker = this.pendingPick
    return {
      platform: process.platform,
      shellVersion: app.getVersion(),
      maximized: this.win?.isMaximized() ?? false,
      tabs: this.store.list().map((server) => {
        const tab = this.tabs.get(server.id)
        return {
          id: server.id,
          name: server.name,
          origin: server.origin,
          status: tab?.status ?? 'loading',
          error: tab?.error ?? null,
          unread: tab?.unread ?? 0
        }
      }),
      activeId: this.activeId,
      update: this.updater.current,
      pendingLink: this.pendingLink,
      picker: picker
        ? {
            tabId: picker.tabId,
            sources: picker.sources.map(
              (source): PickerSource => ({
                id: source.id,
                name: source.name,
                kind: source.id.startsWith('screen:') ? 'screen' : 'window',
                thumbnail: source.thumbnail.toDataURL()
              })
            )
          }
        : null
    }
  }

  private publish(): void {
    const win = this.win
    if (!win || win.isDestroyed()) return
    win.webContents.send('shell:state', this.state())
  }
}
