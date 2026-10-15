import { API_CONFIG } from '$src/shared/config'

const GUEST_TOKEN_KEY = 'meetingGuestToken'

export function getGuestToken(): string | null {
  return sessionStorage.getItem(GUEST_TOKEN_KEY)
}

export function setGuestToken(token: string): void {
  sessionStorage.setItem(GUEST_TOKEN_KEY, token)
}

export function clearGuestToken(): void {
  sessionStorage.removeItem(GUEST_TOKEN_KEY)
}

function url(path: string): string {
  return `${API_CONFIG.baseUrl}${path}`
}

function headers(): Record<string, string> {
  const token = getGuestToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }
}

export async function publicPost(path: string, body: unknown = null): Promise<Response> {
  return fetch(url(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body === null ? undefined : JSON.stringify(body)
  })
}

export async function guestPost(path: string, body: unknown = null): Promise<Response> {
  return fetch(url(path), {
    method: 'POST',
    headers: headers(),
    body: body === null ? undefined : JSON.stringify(body)
  })
}

export async function guestGet(path: string): Promise<Response> {
  return fetch(url(path), { method: 'GET', headers: headers() })
}
