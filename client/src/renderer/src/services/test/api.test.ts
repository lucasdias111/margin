import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  authenticatedGet,
  authenticatedPost,
  authenticatedPostForm,
  authenticatedPatchForm,
  authenticatedDelete,
  unauthenticatedPost
} from '../api'
import { errorService } from '$src/services/ErrorService'

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
    vi.clearAllMocks()
    sessionStorage.clear()
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

    it('reports error when no token is present', async () => {
      mockFetchOk()

      await authenticatedGet('users/1')

      expect(errorService.reportError).toHaveBeenCalledWith('Token is required')
    })

    it('reports error with detail from response on non-ok', async () => {
      sessionStorage.setItem('authToken', 'token')
      mockFetchError(403, { detail: 'Forbidden access' })

      await authenticatedGet('users/1')

      expect(errorService.reportError).toHaveBeenCalledWith('Forbidden access')
    })

    it('reports error with message field when detail is absent', async () => {
      sessionStorage.setItem('authToken', 'token')
      mockFetchError(400, { message: 'Bad request body' })

      await authenticatedGet('users/1')

      expect(errorService.reportError).toHaveBeenCalledWith('Bad request body')
    })

    it('falls back to status code when response body has no detail or message', async () => {
      sessionStorage.setItem('authToken', 'token')
      mockFetchError(500, {})

      await authenticatedGet('users/1')

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

      await authenticatedGet('users/1')

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

    it('reports error when no token is present', async () => {
      mockFetchOk()

      await authenticatedPost({}, 'test')

      expect(errorService.reportError).toHaveBeenCalledWith('Token is required')
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

    it('reports error when no token is present', async () => {
      mockFetchOk()

      await authenticatedPostForm(new FormData(), 'upload')

      expect(errorService.reportError).toHaveBeenCalledWith('No token found')
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

      await authenticatedPatchForm(new FormData(), 'update')

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

      await authenticatedDelete(1, 'margins/delete')

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
})
