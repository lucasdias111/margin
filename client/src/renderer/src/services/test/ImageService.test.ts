import { beforeEach, describe, expect, it, vi } from 'vitest'
import { imageService } from '../ImageService'
import * as api from '$src/services/api'

vi.mock('$src/services/api', () => ({
  authenticatedGet: vi.fn()
}))

function okResponse(): Response {
  return { ok: true, blob: async () => new Blob(['bytes']) } as unknown as Response
}

function errorResponse(status: number): Response {
  return { ok: false, status, blob: async () => new Blob(['err']) } as unknown as Response
}

let objectUrlSeq = 0

describe('ImageService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(imageService as unknown as { cache: Map<string, unknown> }).cache.clear()
    objectUrlSeq = 0
    globalThis.URL.createObjectURL = vi.fn(() => `blob:${++objectUrlSeq}`)
  })

  it('returns non-api paths unchanged without fetching', async () => {
    const url = 'https://files.margin.chat/avatars/abc.png'

    const result = await imageService.getAuthenticatedImageUrl(url)

    expect(result).toBe(url)
    expect(api.authenticatedGet).not.toHaveBeenCalled()
  })

  it('returns a falsy path unchanged', async () => {
    expect(await imageService.getAuthenticatedImageUrl('')).toBe('')
    expect(api.authenticatedGet).not.toHaveBeenCalled()
  })

  it('fetches the stripped path and returns an object URL for api paths', async () => {
    vi.mocked(api.authenticatedGet).mockResolvedValue(okResponse())

    const result = await imageService.getAuthenticatedImageUrl('https://margin.chat/api/files/x')

    expect(api.authenticatedGet).toHaveBeenCalledWith('files/x')
    expect(result).toBe('blob:1')
  })

  it('caches the result and does not refetch on a second call', async () => {
    vi.mocked(api.authenticatedGet).mockResolvedValue(okResponse())
    const path = 'https://margin.chat/api/files/x'

    const first = await imageService.getAuthenticatedImageUrl(path)
    const second = await imageService.getAuthenticatedImageUrl(path)

    expect(first).toBe(second)
    expect(api.authenticatedGet).toHaveBeenCalledTimes(1)
  })

  it('dedupes concurrent requests into a single fetch', async () => {
    vi.mocked(api.authenticatedGet).mockResolvedValue(okResponse())
    const path = 'https://margin.chat/api/files/x'

    const [a, b] = await Promise.all([
      imageService.getAuthenticatedImageUrl(path),
      imageService.getAuthenticatedImageUrl(path)
    ])

    expect(a).toBe(b)
    expect(api.authenticatedGet).toHaveBeenCalledTimes(1)
  })

  it('does not cache failures — a later call retries and can succeed', async () => {
    const path = 'https://margin.chat/api/files/x'
    vi.mocked(api.authenticatedGet).mockResolvedValueOnce(errorResponse(401))

    await expect(imageService.getAuthenticatedImageUrl(path)).rejects.toThrow()

    vi.mocked(api.authenticatedGet).mockResolvedValueOnce(okResponse())
    const result = await imageService.getAuthenticatedImageUrl(path)

    expect(result).toBe('blob:1')
    expect(api.authenticatedGet).toHaveBeenCalledTimes(2)
  })
})
