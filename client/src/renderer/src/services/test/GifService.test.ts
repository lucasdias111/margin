import { describe, expect, it, vi } from 'vitest'
import { gifService } from '../GifService'
import { authenticatedGet } from '$src/services/api'

vi.mock('$src/services/api', () => ({ authenticatedGet: vi.fn() }))

const gif = { url: 'https://static.klipy.com/a.gif', width: 200, height: 100, size: 1 }

describe('gifService', () => {
  it("searches through the instance's proxy and maps KLIPY's response", async () => {
    vi.mocked(authenticatedGet).mockResolvedValue({
      ok: true,
      json: async () => ({
        result: true,
        data: {
          data: [{ id: 1, title: 'wave', file: { md: { gif }, sm: { gif } } }],
          current_page: 1,
          per_page: 24,
          has_next: true
        }
      })
    } as Response)

    const page = await gifService.search('wave')

    expect(authenticatedGet).toHaveBeenCalledWith('gifs/search?q=wave')
    expect(page.next).toBe('2')
    expect(page.results[0]).toMatchObject({ id: '1', gifUrl: gif.url })
  })
})
