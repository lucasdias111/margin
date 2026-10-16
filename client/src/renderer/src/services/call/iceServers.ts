import { authenticatedGet } from '$src/services/api'
import { guestGet } from '$src/services/meetingApi'
import { meetingGuestService } from '$src/services/MeetingGuestService'

// Each instance hands out its own STUN server and short-lived TURN credentials, so they are
// fetched before every call. Meeting guests ask with their guest token. If the request fails
// the call still starts and relies on direct connectivity.
export async function fetchIceServers(): Promise<RTCIceServer[]> {
  try {
    const response = meetingGuestService.hasSession()
      ? await guestGet('ice-servers')
      : await authenticatedGet('ice-servers')
    if (!response.ok) return []
    const servers: { urls: string[]; username: string | null; credential: string | null }[] =
      await response.json()
    return servers.map(({ urls, username, credential }) => ({
      urls,
      ...(username ? { username } : {}),
      ...(credential ? { credential } : {})
    }))
  } catch {
    return []
  }
}

// The server may announce the SFU as a path on this origin (`/sfu`, the default behind the
// bundled proxy) or as an absolute http(s)/ws(s) URL.
export function sfuSocketUrl(sfuUrl: string): string {
  const resolved = new URL(sfuUrl, window.location.href)
  if (resolved.protocol === 'http:') resolved.protocol = 'ws:'
  if (resolved.protocol === 'https:') resolved.protocol = 'wss:'
  return resolved.toString()
}
