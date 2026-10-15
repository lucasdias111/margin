import { CONFIG } from '$src/shared/config'

const BASE_URL = 'https://api.klipy.com/api/v1'
const PER_PAGE = 24

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

function buildUrl(path: string, params: Record<string, string>): string {
  if (!CONFIG.apiKey) {
    throw new Error('KLIPY API key not configured (set VITE_KLIPY_API_KEY)')
  }
  const url = new URL(`${BASE_URL}/${CONFIG.apiKey}${path}`)
  url.searchParams.set('per_page', String(PER_PAGE))
  url.searchParams.set('format_filter', 'gif')
  for (const [k, v] of Object.entries(params)) {
    if (v) url.searchParams.set(k, v)
  }
  return url.toString()
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
  const response = await fetch(buildUrl(path, params))
  if (!response.ok) throw new Error(`KLIPY request failed: ${response.status}`)
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
    return fetchPage('/gifs/trending', params)
  },
  search(query: string, page = ''): Promise<GifPage> {
    const params: Record<string, string> = { q: query }
    if (page) params.page = page
    return fetchPage('/gifs/search', params)
  }
}
