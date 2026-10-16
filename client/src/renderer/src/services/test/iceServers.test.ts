import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchIceServers, sfuSocketUrl } from '../call/iceServers'
import { authenticatedGet } from '$src/services/api'
import { guestGet } from '$src/services/meetingApi'
import { meetingGuestService } from '$src/services/MeetingGuestService'

vi.mock('$src/services/api', () => ({ authenticatedGet: vi.fn() }))
vi.mock('$src/services/meetingApi', () => ({ guestGet: vi.fn() }))
vi.mock('$src/services/MeetingGuestService', () => ({
  meetingGuestService: { hasSession: vi.fn() }
}))

const servers = [
  { urls: ['stun:chat.example.com:3478'], username: null, credential: null },
  {
    urls: ['turn:chat.example.com:3478?transport=udp'],
    username: '1760000000:ab12',
    credential: 'c2VjcmV0'
  }
]

function ok(body: unknown): Response {
  return { ok: true, json: async () => body } as Response
}

describe('fetchIceServers', () => {
  beforeEach(() => {
    vi.mocked(meetingGuestService.hasSession).mockReturnValue(false)
  })

  it("asks the instance with the user's session and drops empty credentials", async () => {
    vi.mocked(authenticatedGet).mockResolvedValue(ok(servers))

    expect(await fetchIceServers()).toEqual([
      { urls: ['stun:chat.example.com:3478'] },
      {
        urls: ['turn:chat.example.com:3478?transport=udp'],
        username: '1760000000:ab12',
        credential: 'c2VjcmV0'
      }
    ])
    expect(authenticatedGet).toHaveBeenCalledWith('ice-servers')
  })

  it('asks with the guest token when a meeting guest is in the call', async () => {
    vi.mocked(meetingGuestService.hasSession).mockReturnValue(true)
    vi.mocked(guestGet).mockResolvedValue(ok(servers))

    await fetchIceServers()

    expect(guestGet).toHaveBeenCalledWith('ice-servers')
  })

  it('lets the call start without relays when the request fails', async () => {
    vi.mocked(authenticatedGet).mockRejectedValue(new Error('offline'))

    expect(await fetchIceServers()).toEqual([])
  })
})

describe('sfuSocketUrl', () => {
  it('resolves a path against the page origin as a websocket URL', () => {
    expect(sfuSocketUrl('/sfu')).toBe(`ws://${window.location.host}/sfu`)
  })

  it('turns an absolute https URL into wss', () => {
    expect(sfuSocketUrl('https://chat.example.com/sfu')).toBe('wss://chat.example.com/sfu')
  })

  it('keeps an absolute websocket URL', () => {
    expect(sfuSocketUrl('ws://localhost:3000')).toBe('ws://localhost:3000/')
  })
})
