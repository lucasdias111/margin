vi.mock('electron', () => ({ app: {}, net: {}, shell: {} }))
vi.mock('electron-updater', () => ({ default: { autoUpdater: {} } }))

import { isNewer, latestShellRelease, type GithubRelease } from '../updates'

function release(tag: string, extra: Partial<GithubRelease> = {}): GithubRelease {
  return {
    tag_name: tag,
    html_url: `https://github.com/lucasdias111/margin/releases/tag/${tag}`,
    draft: false,
    prerelease: false,
    ...extra
  }
}

describe('latestShellRelease', () => {
  it('picks the newest desktop release and skips instance releases', () => {
    const latest = latestShellRelease([
      release('v1.4.0'),
      release('desktop-v1.0.2'),
      release('desktop-v1.10.0'),
      release('desktop-v1.9.9'),
      release('desktop-v2.0.0', { draft: true }),
      release('desktop-v1.11.0-beta.1'),
      release('desktop-v1.12.0', { prerelease: true })
    ])
    expect(latest).toEqual({
      tag: 'desktop-v1.10.0',
      version: '1.10.0',
      url: 'https://github.com/lucasdias111/margin/releases/tag/desktop-v1.10.0'
    })
  })

  it('returns null when there is no desktop release', () => {
    expect(latestShellRelease([release('v1.0.0')])).toBeNull()
  })
})

describe('isNewer', () => {
  it('compares numerically', () => {
    expect(isNewer('1.10.0', '1.9.0')).toBe(true)
    expect(isNewer('1.0.0', '1.0.0')).toBe(false)
    expect(isNewer('0.9.9', '1.0.0')).toBe(false)
    expect(isNewer('garbage', '1.0.0')).toBe(false)
  })
})
