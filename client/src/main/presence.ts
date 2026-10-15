import { BrowserWindow, powerMonitor } from 'electron'

export type UserStatus = 'active' | 'idle' | 'away'

const IDLE_THRESHOLD_SECONDS = 300
const IDLE_POLL_MS = 10_000

export function setupPresence(window: BrowserWindow): void {
  function send(status: UserStatus): void {
    if (window.isDestroyed()) return
    window.webContents.send('user-status', status)
  }

  const interval = setInterval(() => {
    if (powerMonitor.getSystemIdleState(IDLE_THRESHOLD_SECONDS) === 'idle') {
      send('idle')
    }
  }, IDLE_POLL_MS)

  const onAway = (): void => send('away')
  const onActive = (): void => send('active')

  powerMonitor.on('suspend', onAway)
  powerMonitor.on('lock-screen', onAway)
  powerMonitor.on('resume', onActive)
  powerMonitor.on('unlock-screen', onActive)

  window.on('closed', () => {
    clearInterval(interval)
    powerMonitor.off('suspend', onAway)
    powerMonitor.off('lock-screen', onAway)
    powerMonitor.off('resume', onActive)
    powerMonitor.off('unlock-screen', onActive)
  })
}
