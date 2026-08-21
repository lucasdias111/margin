import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  authenticatedDelete,
  authenticatedGet,
  authenticatedPatchForm,
  authenticatedPost,
  authenticatedPostForm,
  setTokenRefresher,
  setUnauthenticatedHandler,
  unauthenticatedPost
} from '../api'
import { errorService } from '$src/services/ErrorService'

function makeJwt(payload: Record<string, unknown>): string {
  const encode = (obj: unknown): string =>
    btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  return `${encode({ alg: 'HS256' })}.${encode(payload)}.fakesignature`
}

function validJwt(): string {
  return makeJwt({ sub: 'a', exp: Math.floor(Date.now() / 1000) + 3600 })
}

function expiredJwt(): string {
  return makeJwt({ sub: 'a', exp: Math.floor(Date.now() / 1000) - 100 })
}

let unauthenticatedHandler: ReturnType<typeof vi.fn<() => Promise<void>>>

vi.mock('$src/services/ErrorService', () => ({
  errorService: {
    reportError: vi.fn()
  }
}))

vi.mock('$src/shared/config', () => ({
  API_CONFIG: {
    baseUrl: 'http://localhost:8080/'
  }
}))

const fetchSpy = vi.spyOn(globalThis, 'fetch')

function mockFetchOk(body: Record<string, unknown> = {}): void {
  fetchSpy.mockResolvedValue({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => body
  } as Response)
}

function mockFetchError(status: number, body?: Record<string, unknown>): void {
  fetchSpy.mockResolvedValue({
    ok: false,
    status,
    statusText: 'Error',
    json: async () => body ?? {}
  } as Response)
}

function mockFetchNetworkError(): void {
  fetchSpy.mockRejectedValue(new Error('Network failure'))
}

describe('API helpers', () => {
  beforeEach(() => {
    sessionStorage.clear()
    unauthenticatedHandler = vi.fn<() => Promise<void>>().mockResolvedValue(undefined)
    setUnauthenticatedHandler(unauthenticatedHandler)
  })

  describe('authenticatedGet', () => {
    it('sends GET with auth token', async () => {
      sessionStorage.setItem('authToken', 'my-token')
      mockFetchOk()

      await authenticatedGet('users/1')

      expect(fetchSpy).toHaveBeenCalledWith('http://localhost:8080/users/1', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer my-token'
        }
      })
    })

    it('reports error with detail from response on non-ok', async () => {
      sessionStorage.setItem('authToken', 'token')
      mockFetchError(403, { detail: 'Forbidden access' })

      await expect(authenticatedGet('users/1')).rejects.toThrow('Forbidden access')
      expect(errorService.reportError).toHaveBeenCalledWith('Forbidden access')
    })

    it('reports error with message field when detail is absent', async () => {
      sessionStorage.setItem('authToken', 'token')
      mockFetchError(400, { message: 'Bad request body' })

      await expect(authenticatedGet('users/1')).rejects.toThrow('Bad request body')
      expect(errorService.reportError).toHaveBeenCalledWith('Bad request body')
    })

    it('falls back to status code when response body has no detail or message', async () => {
      sessionStorage.setItem('authToken', 'token')
      mockFetchError(500, {})

      await expect(authenticatedGet('users/1')).rejects.toThrow('Error 500')
      expect(errorService.reportError).toHaveBeenCalledWith('Error 500')
    })

    it('falls back to status code when response json parsing fails', async () => {
      sessionStorage.setItem('authToken', 'token')
      fetchSpy.mockResolvedValue({
        ok: false,
        status: 502,
        statusText: 'Bad Gateway',
        json: async () => {
          throw new Error('not json')
        }
      } as unknown as Response)

      await expect(authenticatedGet('users/1')).rejects.toThrow('Error 502')
      expect(errorService.reportError).toHaveBeenCalledWith('Error 502')
    })

    it('reports network error and rethrows on fetch failure', async () => {
      sessionStorage.setItem('authToken', 'token')
      mockFetchNetworkError()

      await expect(authenticatedGet('users/1')).rejects.toThrow('Network failure')
      expect(errorService.reportError).toHaveBeenCalledWith(
        'Network error — could not reach server'
      )
    })
  })

  describe('authenticatedPost', () => {
    it('sends POST with JSON body and auth token', async () => {
      sessionStorage.setItem('authToken', 'my-token')
      mockFetchOk()

      await authenticatedPost({ name: 'test' }, 'margins/create')

      expect(fetchSpy).toHaveBeenCalledWith('http://localhost:8080/margins/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer my-token'
        },
        body: JSON.stringify({ name: 'test' })
      })
    })
  })

  describe('authenticatedPostForm', () => {
    it('sends POST with FormData and no Content-Type header', async () => {
      sessionStorage.setItem('authToken', 'my-token')
      mockFetchOk()

      const formData = new FormData()
      formData.append('field', 'value')

      await authenticatedPostForm(formData, 'upload')

      expect(fetchSpy).toHaveBeenCalledWith('http://localhost:8080/upload', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer my-token'
        },
        body: formData
      })
    })
  })

  describe('authenticatedPatchForm', () => {
    it('sends PATCH with FormData and auth token', async () => {
      sessionStorage.setItem('authToken', 'my-token')
      mockFetchOk()

      const formData = new FormData()
      formData.append('field', 'updated')

      await authenticatedPatchForm(formData, 'update')

      expect(fetchSpy).toHaveBeenCalledWith('http://localhost:8080/update', {
        method: 'PATCH',
        headers: {
          Authorization: 'Bearer my-token'
        },
        body: formData
      })
    })

    it('reports error on non-ok response', async () => {
      sessionStorage.setItem('authToken', 'token')
      mockFetchError(422, { detail: 'Validation failed' })

      await expect(authenticatedPatchForm(new FormData(), 'update')).rejects.toThrow(
        'Validation failed'
      )
      expect(errorService.reportError).toHaveBeenCalledWith('Validation failed')
    })

    it('reports network error and rethrows on fetch failure', async () => {
      sessionStorage.setItem('authToken', 'token')
      mockFetchNetworkError()

      await expect(authenticatedPatchForm(new FormData(), 'update')).rejects.toThrow()
      expect(errorService.reportError).toHaveBeenCalledWith(
        'Network error — could not reach server'
      )
    })
  })

  describe('authenticatedDelete', () => {
    it('sends DELETE with JSON body and auth token', async () => {
      sessionStorage.setItem('authToken', 'my-token')
      mockFetchOk()

      await authenticatedDelete(42, 'margins/delete')

      expect(fetchSpy).toHaveBeenCalledWith('http://localhost:8080/margins/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer my-token'
        },
        body: JSON.stringify(42)
      })
    })

    it('reports error on non-ok response', async () => {
      sessionStorage.setItem('authToken', 'token')
      mockFetchError(404, { message: 'Not found' })

      await expect(authenticatedDelete(1, 'margins/delete')).rejects.toThrow('Not found')
      expect(errorService.reportError).toHaveBeenCalledWith('Not found')
    })

    it('reports network error and rethrows on fetch failure', async () => {
      sessionStorage.setItem('authToken', 'token')
      mockFetchNetworkError()

      await expect(authenticatedDelete(1, 'margins/delete')).rejects.toThrow()
      expect(errorService.reportError).toHaveBeenCalledWith(
        'Network error — could not reach server'
      )
    })
  })

  describe('unauthenticatedPost', () => {
    it('sends POST without auth header', async () => {
      mockFetchOk()

      await unauthenticatedPost({ email: 'test@test.com' }, 'auth/login')

      expect(fetchSpy).toHaveBeenCalledWith('http://localhost:8080/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: 'test@test.com' })
      })
    })

    it('does not include Authorization header', async () => {
      sessionStorage.setItem('authToken', 'should-not-appear')
      mockFetchOk()

      await unauthenticatedPost({}, 'auth/login')

      const callHeaders = fetchSpy.mock.calls[0][1]?.headers as Record<string, string>
      expect(callHeaders).not.toHaveProperty('Authorization')
    })
  })

  describe('auth failure handling', () => {
    it('does not call the unauthenticated handler when the token is valid and unexpired', async () => {
      sessionStorage.setItem('authToken', validJwt())
      mockFetchOk()

      await authenticatedGet('users/me')

      expect(unauthenticatedHandler).not.toHaveBeenCalled()
    })

    it('calls the unauthenticated handler when the token is missing', async () => {
      mockFetchOk()

      await authenticatedGet('users/me')

      expect(unauthenticatedHandler).toHaveBeenCalledTimes(1)
      expect(errorService.reportError).toHaveBeenCalledWith('Session expired - logging out')
    })

    it('calls the unauthenticated handler when the JWT is expired', async () => {
      sessionStorage.setItem('authToken', expiredJwt())
      mockFetchOk()

      await authenticatedGet('users/me')

      expect(unauthenticatedHandler).toHaveBeenCalledTimes(1)
    })

    it('calls the unauthenticated handler when the token is malformed (no periods)', async () => {
      sessionStorage.setItem('authToken', 'not-a-jwt')
      mockFetchOk()

      await authenticatedGet('users/me')

      expect(unauthenticatedHandler).toHaveBeenCalledTimes(1)
    })

    it('calls the unauthenticated handler when the server responds 401', async () => {
      sessionStorage.setItem('authToken', validJwt())
      mockFetchError(401, { detail: 'Token rejected' })

      const response = await authenticatedGet('users/me')

      expect(response.status).toBe(401)
      expect(unauthenticatedHandler).toHaveBeenCalledTimes(1)
      expect(errorService.reportError).toHaveBeenCalledWith('Session expired - logging out')
    })

    it('does NOT call the unauthenticated handler on 403 (authenticated but forbidden)', async () => {
      sessionStorage.setItem('authToken', validJwt())
      mockFetchError(403, { detail: 'Forbidden' })

      await expect(authenticatedGet('users/me')).rejects.toThrow('Forbidden')

      expect(unauthenticatedHandler).not.toHaveBeenCalled()
    })

    it('deduplicates the handler across concurrent 401 responses', async () => {
      sessionStorage.setItem('authToken', validJwt())
      mockFetchError(401, {})

      let resolveHandler: () => void = () => {}
      unauthenticatedHandler.mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            resolveHandler = resolve
          })
      )

      const calls = [
        authenticatedGet('a').catch(() => {}),
        authenticatedGet('b').catch(() => {}),
        authenticatedGet('c').catch(() => {})
      ]

      await new Promise((r) => setTimeout(r, 0))
      resolveHandler()
      await Promise.all(calls)

      expect(unauthenticatedHandler).toHaveBeenCalledTimes(1)
    })

    it('triggers the handler exactly once for concurrent missing-token requests', async () => {
      mockFetchOk()

      let resolveHandler: () => void = () => {}
      unauthenticatedHandler.mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            resolveHandler = resolve
          })
      )

      const calls = [authenticatedGet('a'), authenticatedGet('b'), authenticatedGet('c')]

      await new Promise((r) => setTimeout(r, 0))
      resolveHandler()
      await Promise.all(calls)

      expect(unauthenticatedHandler).toHaveBeenCalledTimes(1)
    })

    it('is a no-op when no handler is registered', async () => {
      setUnauthenticatedHandler(undefined as unknown as () => Promise<void>)
      mockFetchOk()

      await expect(authenticatedGet('users/me')).resolves.toBeDefined()
    })
  })

  describe('token refresh', () => {
    beforeEach(() => {
      setTokenRefresher(undefined as unknown as () => Promise<boolean>)
    })

    it('renews an expired token and sends the new one', async () => {
      sessionStorage.setItem('authToken', expiredJwt())
      const fresh = makeJwt({ exp: Math.floor(Date.now() / 1000) + 900 })
      setTokenRefresher(async () => {
        sessionStorage.setItem('authToken', fresh)
        return true
      })
      mockFetchOk()

      await authenticatedGet('users/me')

      expect(fetchSpy).toHaveBeenCalledWith(
        'http://localhost:8080/users/me',
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: `Bearer ${fresh}` })
        })
      )
      expect(unauthenticatedHandler).not.toHaveBeenCalled()
    })

    it('logs out when the expired token cannot be renewed', async () => {
      sessionStorage.setItem('authToken', expiredJwt())
      setTokenRefresher(async () => false)
      mockFetchOk()

      await authenticatedGet('users/me')

      expect(unauthenticatedHandler).toHaveBeenCalled()
    })

    it('collapses concurrent renewals onto a single exchange', async () => {
      // Refresh tokens rotate server-side, so a second parallel exchange would present a token
      // the server has already consumed — which it reads as a replay and punishes by revoking
      // every session the user has.
      sessionStorage.setItem('authToken', expiredJwt())
      const refresher = vi.fn(async () => {
        await new Promise((r) => setTimeout(r, 5))
        sessionStorage.setItem('authToken', validJwt())
        return true
      })
      setTokenRefresher(refresher)
      mockFetchOk()

      await Promise.all([authenticatedGet('a'), authenticatedGet('b'), authenticatedGet('c')])

      expect(refresher).toHaveBeenCalledTimes(1)
    })

    it('recovers a 401 by renewing rather than logging out', async () => {
      sessionStorage.setItem('authToken', validJwt())
      setTokenRefresher(async () => true)
      mockFetchError(401, { detail: 'Token rejected' })

      const response = await authenticatedGet('users/me')

      // The 401 still comes back to the caller — the renewal only spares the session.
      expect(response.status).toBe(401)
      expect(unauthenticatedHandler).not.toHaveBeenCalled()
    })

    it('logs out on a 401 that renewing cannot fix', async () => {
      sessionStorage.setItem('authToken', validJwt())
      setTokenRefresher(async () => false)
      mockFetchError(401, { detail: 'Token rejected' })

      await authenticatedGet('users/me')

      expect(unauthenticatedHandler).toHaveBeenCalled()
    })
  })
})
