import { isExternalOpenable, isSameOrigin, normalizeServerUrl, parseDeepLink } from '../urls'

describe('normalizeServerUrl', () => {
  it('assumes https and keeps only the origin', () => {
    expect(normalizeServerUrl('  chat.example.com/some/path?x=1 ')).toEqual({
      ok: true,
      origin: 'https://chat.example.com'
    })
    expect(normalizeServerUrl('https://chat.example.com:8443/')).toEqual({
      ok: true,
      origin: 'https://chat.example.com:8443'
    })
  })

  it('allows plain http only for this machine', () => {
    expect(normalizeServerUrl('http://localhost:8080')).toEqual({
      ok: true,
      origin: 'http://localhost:8080'
    })
    expect(normalizeServerUrl('http://127.0.0.1')).toMatchObject({ ok: true })
    expect(normalizeServerUrl('http://chat.example.com')).toMatchObject({ ok: false })
  })

  it('rejects empty input, other schemes and credentials', () => {
    expect(normalizeServerUrl('   ')).toMatchObject({ ok: false })
    expect(normalizeServerUrl('ftp://chat.example.com')).toMatchObject({ ok: false })
    expect(normalizeServerUrl('javascript://alert(1)')).toMatchObject({ ok: false })
    expect(normalizeServerUrl('https://me:pw@chat.example.com')).toMatchObject({ ok: false })
  })
})

describe('isSameOrigin', () => {
  it('compares scheme, host and port', () => {
    const origin = 'https://chat.example.com'
    expect(isSameOrigin('https://chat.example.com/meet/abc', origin)).toBe(true)
    expect(isSameOrigin('http://chat.example.com/', origin)).toBe(false)
    expect(isSameOrigin('https://chat.example.com:444/', origin)).toBe(false)
    expect(isSameOrigin('https://chat.example.com.evil.test/', origin)).toBe(false)
    expect(isSameOrigin('not a url', origin)).toBe(false)
  })
})

describe('isExternalOpenable', () => {
  it('only lets web and mail links leave the app', () => {
    expect(isExternalOpenable('https://example.com')).toBe(true)
    expect(isExternalOpenable('mailto:a@example.com')).toBe(true)
    expect(isExternalOpenable('file:///etc/passwd')).toBe(false)
    expect(isExternalOpenable('smb://share')).toBe(false)
  })
})

describe('parseDeepLink', () => {
  it('reads the https link out of margin://open', () => {
    const target = 'https://chat.example.com/meet/abc'
    expect(parseDeepLink(`margin://open?url=${encodeURIComponent(target)}`)).toBe(target)
  })

  it('ignores other actions and non-web targets', () => {
    expect(parseDeepLink('margin://meet/abc')).toBeNull()
    expect(parseDeepLink('margin://open')).toBeNull()
    expect(parseDeepLink('margin://open?url=file%3A%2F%2F%2Fetc')).toBeNull()
    expect(parseDeepLink('https://open?url=https://x')).toBeNull()
  })
})
