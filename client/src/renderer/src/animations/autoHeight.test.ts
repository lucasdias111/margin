import { describe, expect, it, vi } from 'vitest'
import { autoHeight } from '$src/animations'

describe('autoHeight', () => {
  it('bails out cleanly when the container has no element child', () => {
    const node = document.createElement('div')
    const handle = autoHeight(node)
    expect(() => handle.destroy()).not.toThrow()
  })

  it('observes the single element child', () => {
    const observe = vi.fn()
    const disconnect = vi.fn()
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe = observe
        disconnect = disconnect
      }
    )

    const node = document.createElement('div')
    const child = document.createElement('div')
    node.appendChild(child)

    const handle = autoHeight(node)
    expect(observe).toHaveBeenCalledWith(child)

    handle.destroy()
    expect(disconnect).toHaveBeenCalled()
    vi.unstubAllGlobals()
  })
})
