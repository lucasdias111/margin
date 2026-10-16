import { afterEach, describe, expect, it, vi } from 'vitest'

async function freshBridge(): Promise<typeof import('../DesktopBridge').desktopBridge> {
  vi.resetModules()
  return (await import('../DesktopBridge')).desktopBridge
}

describe('desktopBridge', () => {
  afterEach(() => {
    delete window.marginDesktop
    vi.useRealTimers()
  })

  it('uses only the capabilities the shell announces', async () => {
    const setBadgeCount = vi.fn()
    window.marginDesktop = { shellVersion: '1.0.0', capabilities: [], setBadgeCount }
    const bridge = await freshBridge()

    bridge.setBadgeCount(3)
    expect(setBadgeCount).not.toHaveBeenCalled()

    window.marginDesktop.capabilities = ['badge']
    bridge.setBadgeCount(3)
    expect(setBadgeCount).toHaveBeenCalledWith(3)
  })

  it('takes presence from the shell when it offers it', async () => {
    let shellListener: (presence: 'active' | 'idle' | 'away') => void = () => {}
    window.marginDesktop = {
      shellVersion: '1.0.0',
      capabilities: ['presence'],
      onPresence: (listener) => (shellListener = listener)
    }
    const bridge = await freshBridge()
    const seen: string[] = []
    bridge.onPresence((presence) => seen.push(presence))
    bridge.start()

    shellListener('away')
    shellListener('active')

    expect(seen).toEqual(['away', 'active'])
  })

  it('falls back to idle after a while without input in a browser', async () => {
    vi.useFakeTimers()
    const bridge = await freshBridge()
    const seen: string[] = []
    bridge.onPresence((presence) => seen.push(presence))
    bridge.start()

    vi.advanceTimersByTime(5 * 60 * 1000)
    window.dispatchEvent(new Event('keydown'))

    expect(seen).toEqual(['idle', 'active'])
    expect(bridge.inDesktopShell).toBe(false)
  })
})
