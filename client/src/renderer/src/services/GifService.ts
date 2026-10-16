import { authenticatedGet } from '$src/services/api'

// Searches go through the instance, which holds the operator's KLIPY key and passes KLIPY's
// response through unchanged. The picker is only shown when the instance has GIFs turned on.

export interface Gif {
  id: string
  description: string
  thumbnailUrl: string
  gifUrl: string
  width: number
  height: number
}

export interface GifPage {
  results: Gif[]
  next: string
}

interface KlipyFormat {
  url: string
  width: number
  height: number
  size: number
}

interface KlipySize {
  gif?: KlipyFormat
}

interface KlipyFile {
  hd?: KlipySize
  md?: KlipySize
  sm?: KlipySize
  xs?: KlipySize
}

interface KlipyRawResult {
  id: number | string
  slug?: string
  title?: string
  file: KlipyFile
}

interface KlipyResponse {
  result: boolean
  data: {
    data: KlipyRawResult[]
    current_page: number
    per_page: number
    has_next: boolean
  }
}

function mapResult(raw: KlipyRawResult): Gif | null {
  const full = raw.file?.md?.gif ?? raw.file?.hd?.gif
  const thumb = raw.file?.sm?.gif ?? raw.file?.xs?.gif ?? full
  if (!full || !thumb) return null
  return {
    id: String(raw.id),
    description: raw.title ?? '',
    thumbnailUrl: thumb.url,
    gifUrl: full.url,
    width: full.width,
    height: full.height
  }
}

async function fetchPage(path: string, params: Record<string, string>): Promise<GifPage> {
  const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value))
  const response = await authenticatedGet(`gifs${path}?${query}`)
  if (!response.ok) throw new Error(`GIF request failed: ${response.status}`)
  const body: KlipyResponse = await response.json()
  if (!body.result) throw new Error('KLIPY request returned result=false')
  const next = body.data.has_next ? String(body.data.current_page + 1) : ''
  return {
    results: body.data.data.map(mapResult).filter((g): g is Gif => g !== null),
    next
  }
}

export const gifService = {
  featured(page = ''): Promise<GifPage> {
    const params: Record<string, string> = {}
    if (page) params.page = page
    return fetchPage('/trending', params)
  },
  search(query: string, page = ''): Promise<GifPage> {
    const params: Record<string, string> = { q: query }
    if (page) params.page = page
    return fetchPage('/search', params)
  }
}
