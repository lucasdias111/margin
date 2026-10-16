import { powerMonitor } from 'electron'

export type UserStatus = 'active' | 'idle' | 'away'

const IDLE_THRESHOLD_SECONDS = 300
const IDLE_POLL_MS = 10_000

// Presence comes from the OS (idle, lock, suspend) and is broadcast to every server tab.
// Returns a function that stops watching.
export function setupPresence(broadcast: (status: UserStatus) => void): () => void {
  const interval = setInterval(() => {
    if (powerMonitor.getSystemIdleState(IDLE_THRESHOLD_SECONDS) === 'idle') {
      broadcast('idle')
    }
  }, IDLE_POLL_MS)

  const onAway = (): void => broadcast('away')
  const onActive = (): void => broadcast('active')

  powerMonitor.on('suspend', onAway)
  powerMonitor.on('lock-screen', onAway)
  powerMonitor.on('resume', onActive)
  powerMonitor.on('unlock-screen', onActive)

  return () => {
    clearInterval(interval)
    powerMonitor.off('suspend', onAway)
    powerMonitor.off('lock-screen', onAway)
    powerMonitor.off('resume', onActive)
    powerMonitor.off('unlock-screen', onActive)
  }
}
