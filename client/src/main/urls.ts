// URL rules the shell enforces: which servers can be added, which navigations stay in a tab,
// and what a `margin://` link asks for. Pure, so they can be tested without Electron.

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])

export type NormalizedServer = { ok: true; origin: string } | { ok: false; error: string }

// Instances are served at `/` over https. Plain http is only accepted for a server on this
// machine, because the page it loads gets the desktop bridge.
export function normalizeServerUrl(input: string): NormalizedServer {
  const trimmed = input.trim()
  if (!trimmed) return { ok: false, error: 'Enter your server address.' }

  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  let url: URL
  try {
    url = new URL(withScheme)
  } catch {
    return { ok: false, error: 'That doesn’t look like a server address.' }
  }

  if (url.protocol === 'http:' && !LOOPBACK_HOSTS.has(url.hostname)) {
    return { ok: false, error: 'Use an https:// address. Only local servers may use http.' }
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return { ok: false, error: 'Use an https:// address.' }
  }
  if (url.username || url.password) {
    return { ok: false, error: 'Leave the user name and password out of the address.' }
  }
  return { ok: true, origin: url.origin }
}

export function originOf(url: string): string | null {
  try {
    const origin = new URL(url).origin
    return origin === 'null' ? null : origin
  } catch {
    return null
  }
}

export function isSameOrigin(url: string, origin: string): boolean {
  return originOf(url) === origin
}

// Links that leave a tab's server go to the system browser, but only these schemes.
export function isExternalOpenable(url: string): boolean {
  try {
    const { protocol } = new URL(url)
    return protocol === 'https:' || protocol === 'http:' || protocol === 'mailto:'
  } catch {
    return false
  }
}

// `margin://open?url=<https link>` opens that link in the tab for its server.
export function parseDeepLink(link: string): string | null {
  let url: URL
  try {
    url = new URL(link)
  } catch {
    return null
  }
  if (url.protocol !== 'margin:' || url.hostname !== 'open') return null

  const target = url.searchParams.get('url')
  if (!target) return null
  try {
    const { protocol } = new URL(target)
    return protocol === 'https:' || protocol === 'http:' ? target : null
  } catch {
    return null
  }
}
