import { app, net, shell } from 'electron'
import pkg from 'electron-updater'

const { autoUpdater } = pkg

// Shell updates come from GitHub Releases on the monorepo, which also carries the instance's
// `v*` releases. The shell's own releases are tagged `desktop-v*`, so instead of trusting
// GitHub's "latest" release, the shell finds its newest tag and points electron-updater at that
// release's assets. Windows and Linux install in place. macOS builds are unsigned, so they only
// say a new version is out and link to its download page.

export const RELEASES_REPO = 'lucasdias111/margin'
const TAG_PREFIX = 'desktop-v'
const CHECK_EVERY_MS = 12 * 60 * 60 * 1000

export interface GithubRelease {
  tag_name: string
  html_url: string
  draft: boolean
  prerelease: boolean
}

export interface ShellRelease {
  tag: string
  version: string
  url: string
}

export type UpdateState =
  | { kind: 'none' }
  | { kind: 'available'; version: string; url: string; canInstall: boolean }
  | { kind: 'downloading'; version: string; percent: number }
  | { kind: 'ready'; version: string }

function parseVersion(version: string): number[] | null {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version)
  return match ? match.slice(1).map(Number) : null
}

export function isNewer(candidate: string, current: string): boolean {
  const a = parseVersion(candidate)
  const b = parseVersion(current)
  if (!a || !b) return false
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] > b[i]
  }
  return false
}

export function latestShellRelease(releases: GithubRelease[]): ShellRelease | null {
  let latest: ShellRelease | null = null
  for (const release of releases) {
    if (release.draft || release.prerelease || !release.tag_name.startsWith(TAG_PREFIX)) continue
    const version = release.tag_name.slice(TAG_PREFIX.length)
    if (!parseVersion(version)) continue
    if (!latest || isNewer(version, latest.version)) {
      latest = { tag: release.tag_name, version, url: release.html_url }
    }
  }
  return latest
}

function log(...args: unknown[]): void {
  console.log('[updater]', ...args)
}

export class ShellUpdater {
  private state: UpdateState = { kind: 'none' }
  private release: ShellRelease | null = null
  private timer: ReturnType<typeof setInterval> | null = null

  constructor(private readonly onChange: (state: UpdateState) => void) {
    autoUpdater.autoDownload = false
    autoUpdater.autoInstallOnAppQuit = false
    autoUpdater.logger = { info: log, warn: log, error: log, debug: () => {} }

    autoUpdater.on('update-available', (info) => {
      if (!this.release) return
      this.set({
        kind: 'available',
        version: info.version,
        url: this.release.url,
        canInstall: true
      })
    })
    autoUpdater.on('download-progress', (progress) => {
      if (this.state.kind === 'downloading') {
        this.set({ ...this.state, percent: progress.percent })
      }
    })
    autoUpdater.on('update-downloaded', (info) => {
      this.set({ kind: 'ready', version: info.version })
    })
    autoUpdater.on('error', (err) => {
      log('error:', err?.message ?? err)
      // Fall back to a download link when installing in place isn't possible here.
      if (this.release) this.offerDownload(this.release)
    })
  }

  get current(): UpdateState {
    return this.state
  }

  get installsInPlace(): boolean {
    return process.platform === 'win32' || process.platform === 'linux'
  }

  start(): void {
    if (!app.isPackaged) {
      log('Not packaged, skipping update checks')
      return
    }
    void this.check()
    this.timer = setInterval(() => void this.check(), CHECK_EVERY_MS)
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
  }

  async check(): Promise<void> {
    if (this.state.kind === 'downloading' || this.state.kind === 'ready') return
    let release: ShellRelease | null
    try {
      const response = await net.fetch(
        `https://api.github.com/repos/${RELEASES_REPO}/releases?per_page=50`,
        { headers: { accept: 'application/vnd.github+json' } }
      )
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      release = latestShellRelease((await response.json()) as GithubRelease[])
    } catch (err) {
      log('Release lookup failed:', err)
      return
    }

    if (!release || !isNewer(release.version, app.getVersion())) {
      log('Up to date:', app.getVersion())
      return
    }
    this.release = release

    if (!this.installsInPlace) {
      this.offerDownload(release)
      return
    }
    autoUpdater.setFeedURL({
      provider: 'generic',
      url: `https://github.com/${RELEASES_REPO}/releases/download/${release.tag}`
    })
    autoUpdater.checkForUpdates().catch((err) => {
      log('checkForUpdates failed:', err?.message ?? err)
      this.offerDownload(release)
    })
  }

  accept(): void {
    if (this.state.kind !== 'available') return
    if (!this.state.canInstall) {
      void shell.openExternal(this.state.url)
      return
    }
    this.set({ kind: 'downloading', version: this.state.version, percent: 0 })
    autoUpdater.downloadUpdate().catch((err) => log('downloadUpdate failed:', err?.message ?? err))
  }

  install(): void {
    if (this.state.kind !== 'ready') return
    app.removeAllListeners('window-all-closed')
    autoUpdater.quitAndInstall(false, true)
  }

  dismiss(): void {
    if (this.state.kind === 'available') this.set({ kind: 'none' })
  }

  private offerDownload(release: ShellRelease): void {
    this.set({ kind: 'available', version: release.version, url: release.url, canInstall: false })
  }

  private set(state: UpdateState): void {
    this.state = state
    this.onChange(state)
  }
}
