import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { ServerStore, serverIdFor, validateServer } from '../servers'

function respond(status: number, body: unknown): Response {
  return new Response(typeof body === 'string' ? body : JSON.stringify(body), { status })
}

describe('validateServer', () => {
  it('accepts a server whose /api/instance names it', async () => {
    const fetch = vi.fn().mockResolvedValue(respond(200, { name: 'Acme', version: '1.0.0' }))
    await expect(validateServer('chat.acme.test', fetch)).resolves.toEqual({
      ok: true,
      origin: 'https://chat.acme.test',
      instance: { name: 'Acme', version: '1.0.0' }
    })
    expect(fetch).toHaveBeenCalledWith('https://chat.acme.test/api/instance', expect.anything())
  })

  it('rejects unreachable servers, error statuses and other sites', async () => {
    const down = vi.fn().mockRejectedValue(new Error('ENOTFOUND'))
    expect(await validateServer('chat.acme.test', down)).toMatchObject({ ok: false })

    const missing = vi.fn().mockResolvedValue(respond(404, 'nope'))
    expect(await validateServer('chat.acme.test', missing)).toMatchObject({ ok: false })

    const html = vi.fn().mockResolvedValue(respond(200, '<html></html>'))
    expect(await validateServer('chat.acme.test', html)).toMatchObject({ ok: false })

    const other = vi.fn().mockResolvedValue(respond(200, { hello: 'world' }))
    expect(await validateServer('chat.acme.test', other)).toMatchObject({ ok: false })
  })

  it('never fetches an address it refuses', async () => {
    const fetch = vi.fn()
    expect(await validateServer('http://chat.acme.test', fetch)).toMatchObject({ ok: false })
    expect(fetch).not.toHaveBeenCalled()
  })
})

describe('ServerStore', () => {
  let dir: string
  let file: string

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'margin-servers-'))
    file = join(dir, 'nested', 'servers.json')
  })

  afterEach(() => rmSync(dir, { recursive: true, force: true }))

  it('persists servers in order and dedupes by origin', () => {
    const store = new ServerStore(file)
    const acme = store.add('https://chat.acme.test', 'Acme')
    store.add('https://other.test', '  ')
    expect(store.add('https://chat.acme.test', 'Renamed')).toEqual(acme)

    const reopened = new ServerStore(file)
    expect(reopened.list()).toEqual([
      { id: serverIdFor('https://chat.acme.test'), name: 'Acme', origin: 'https://chat.acme.test' },
      { id: serverIdFor('https://other.test'), name: 'other.test', origin: 'https://other.test' }
    ])
  })

  it('removes servers', () => {
    const store = new ServerStore(file)
    const acme = store.add('https://chat.acme.test', 'Acme')
    store.remove(acme.id)
    expect(JSON.parse(readFileSync(file, 'utf8'))).toEqual([])
  })

  it('starts empty from a corrupt file', () => {
    writeFileSync(join(dir, 'servers.json'), '{not json')
    expect(new ServerStore(join(dir, 'servers.json')).list()).toEqual([])
  })
})
