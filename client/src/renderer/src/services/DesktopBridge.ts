// The desktop shell loads this web app in a tab and, only for that tab's own server, exposes
// `window.marginDesktop`. Every feature is checked by capability and falls back to plain
// browser behaviour, so any 1.x shell works with any 1.x instance. Window chrome, screen-share
// picking, deep links, external links and shell updates are the shell's job, not the page's.

export type Presence = 'active' | 'idle' | 'away'

export interface StoredSession {
  token: string
  refreshToken: string | null
  privateKey: string
}

export interface MarginDesktop {
  shellVersion: string
  capabilities: string[]
  setBadgeCount?: (count: number) => void
  onPresence?: (callback: (presence: Presence) => void) => void
  secureStorage?: {
    save: (session: StoredSession) => Promise<void>
    load: () => Promise<StoredSession | null>
    clear: () => Promise<void>
  }
}

declare global {
  interface Window {
    marginDesktop?: MarginDesktop
  }
}

const IDLE_AFTER_MS = 5 * 60 * 1000
const ACTIVITY_EVENTS = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart'] as const

class DesktopBridge {
  private listeners = new Set<(presence: Presence) => void>()
  private presence: Presence = 'active'
  private idleTimer: ReturnType<typeof setTimeout> | null = null
  private started = false

  private get shell(): MarginDesktop | undefined {
    return typeof window === 'undefined' ? undefined : window.marginDesktop
  }

  get inDesktopShell(): boolean {
    return this.shell !== undefined
  }

  has(capability: string): boolean {
    return this.shell?.capabilities?.includes(capability) ?? false
  }

  start(): void {
    if (this.started) return
    this.started = true

    if (this.has('presence') && this.shell?.onPresence) {
      this.shell.onPresence((presence) => this.emit(presence))
      return
    }
    this.watchBrowserPresence()
  }

  onPresence(listener: (presence: Presence) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  setBadgeCount(count: number): void {
    if (this.has('badge')) this.shell?.setBadgeCount?.(count)
  }

  get secureStorage(): MarginDesktop['secureStorage'] | null {
    return this.has('secureStorage') ? (this.shell?.secureStorage ?? null) : null
  }

  // In a browser, presence comes from page visibility plus recent input.
  private watchBrowserPresence(): void {
    const onActivity = (): void => {
      if (document.hidden) return
      this.emit('active')
      this.armIdleTimer()
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.clearIdleTimer()
        this.emit('away')
      } else {
        onActivity()
      }
    })
    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, onActivity, { passive: true })
    }
    this.armIdleTimer()
  }

  private armIdleTimer(): void {
    this.clearIdleTimer()
    this.idleTimer = setTimeout(() => this.emit('idle'), IDLE_AFTER_MS)
  }

  private clearIdleTimer(): void {
    if (this.idleTimer) clearTimeout(this.idleTimer)
    this.idleTimer = null
  }

  private emit(presence: Presence): void {
    if (presence === this.presence) return
    this.presence = presence
    for (const listener of this.listeners) listener(presence)
  }
}

export const desktopBridge = new DesktopBridge()
