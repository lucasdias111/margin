import { createHash } from 'crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname } from 'path'
import { normalizeServerUrl } from './urls'

export interface Server {
  id: string
  name: string
  origin: string
}

export interface InstanceSummary {
  name: string
  version: string
}

export type ValidationResult =
  | { ok: true; origin: string; instance: InstanceSummary }
  | { ok: false; error: string }

type Fetch = (url: string, init?: { signal?: AbortSignal }) => Promise<Response>

const VALIDATE_TIMEOUT_MS = 10_000

// Stable per origin, so a server keeps its session partition and stored keys when re-added.
export function serverIdFor(origin: string): string {
  return createHash('sha256').update(origin).digest('hex').slice(0, 16)
}

// A server is a margin instance when its public `GET /api/instance` answers with a name and
// a version.
export async function validateServer(input: string, fetch: Fetch): Promise<ValidationResult> {
  const normalized = normalizeServerUrl(input)
  if (!normalized.ok) return normalized

  const { origin } = normalized
  let response: Response
  try {
    response = await fetch(`${origin}/api/instance`, {
      signal: AbortSignal.timeout(VALIDATE_TIMEOUT_MS)
    })
  } catch {
    return { ok: false, error: `Couldn’t reach ${origin}.` }
  }
  if (!response.ok) {
    return { ok: false, error: `${origin} isn’t a margin server (HTTP ${response.status}).` }
  }

  try {
    const body = (await response.json()) as Partial<InstanceSummary>
    if (typeof body.name !== 'string' || typeof body.version !== 'string') throw new Error()
    return { ok: true, origin, instance: { name: body.name, version: body.version } }
  } catch {
    return { ok: false, error: `${origin} isn’t a margin server.` }
  }
}

// The user's servers, in tab order, persisted as JSON in userData.
export class ServerStore {
  private servers: Server[]

  constructor(private readonly file: string) {
    this.servers = this.read()
  }

  list(): Server[] {
    return [...this.servers]
  }

  get(id: string): Server | undefined {
    return this.servers.find((server) => server.id === id)
  }

  byOrigin(origin: string): Server | undefined {
    return this.servers.find((server) => server.origin === origin)
  }

  add(origin: string, name: string): Server {
    const existing = this.byOrigin(origin)
    if (existing) return existing

    const server = { id: serverIdFor(origin), name: name.trim() || new URL(origin).host, origin }
    this.servers.push(server)
    this.write()
    return server
  }

  remove(id: string): void {
    this.servers = this.servers.filter((server) => server.id !== id)
    this.write()
  }

  private read(): Server[] {
    if (!existsSync(this.file)) return []
    try {
      const parsed = JSON.parse(readFileSync(this.file, 'utf8'))
      if (!Array.isArray(parsed)) return []
      return parsed.filter(
        (s): s is Server =>
          typeof s?.id === 'string' && typeof s?.name === 'string' && typeof s?.origin === 'string'
      )
    } catch {
      return []
    }
  }

  private write(): void {
    mkdirSync(dirname(this.file), { recursive: true })
    writeFileSync(this.file, JSON.stringify(this.servers, null, 2))
  }
}
