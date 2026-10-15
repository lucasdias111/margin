import { API_CONFIG } from '$src/shared/config'
import { errorService } from '$src/services/ErrorService'

let unauthenticatedHandler: (() => Promise<void>) | null = null
let unauthenticatedInFlight: Promise<void> | null = null
let tokenRefresher: (() => Promise<boolean>) | null = null
let refreshInFlight: Promise<boolean> | null = null

export function setUnauthenticatedHandler(handler: () => Promise<void>): void {
  unauthenticatedHandler = handler
}

export function setTokenRefresher(refresher: () => Promise<boolean>): void {
  tokenRefresher = refresher
}

async function refreshAccessToken(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight
  if (!tokenRefresher) return false
  refreshInFlight = tokenRefresher().finally(() => {
    refreshInFlight = null
  })
  return refreshInFlight
}

async function handleUnauthenticated(): Promise<void> {
  if (unauthenticatedInFlight) return unauthenticatedInFlight
  if (!unauthenticatedHandler) return
  unauthenticatedInFlight = unauthenticatedHandler().finally(() => {
    unauthenticatedInFlight = null
  })
  return unauthenticatedInFlight
}

async function getAuthHeaders(extra: Record<string, string> = {}): Promise<Record<string, string>> {
  let token = sessionStorage.getItem('authToken')

  if (!token || isJwtExpired(token)) {
    const renewed = (await refreshAccessToken()) ? sessionStorage.getItem('authToken') : null
    if (renewed) {
      token = renewed
    } else {
      await handleUnauthenticated()
      errorService.reportError('Session expired - logging out')
    }
  }

  return {
    Authorization: `Bearer ${token}`,
    ...extra
  }
}

function isJwtExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()
  } catch {
    return true
  }
}

export async function authenticatedGet(url: string): Promise<Response> {
  const headers = await getAuthHeaders({ 'Content-Type': 'application/json' })
  return fetchGet(url, headers)
}

export async function authenticatedPost<T>(body: T, url: string): Promise<Response> {
  const headers = await getAuthHeaders({ 'Content-Type': 'application/json' })
  return fetchPost(url, body, headers)
}

export async function authenticatedPostForm(formData: FormData, url: string): Promise<Response> {
  const headers = await getAuthHeaders()
  return fetchPost(url, formData, headers)
}

export async function authenticatedPatchForm(formData: FormData, url: string): Promise<Response> {
  const headers = await getAuthHeaders()
  return fetchPatch(url, formData, headers)
}

export async function authenticatedPatch<T>(body: T, url: string): Promise<Response> {
  const headers = await getAuthHeaders({ 'Content-Type': 'application/json' })
  return fetchPatch(url, body, headers)
}

export async function authenticatedPut<T>(body: T, url: string): Promise<Response> {
  const headers = await getAuthHeaders({ 'Content-Type': 'application/json' })
  return fetchPut(url, body, headers)
}

export async function authenticatedDelete<T>(body: T, url: string): Promise<Response> {
  const headers = await getAuthHeaders({ 'Content-Type': 'application/json' })
  return fetchDelete(url, body, headers)
}

export async function unauthenticatedPost<T>(body: T, url: string): Promise<Response> {
  return fetchPost(url, body, {
    'Content-Type': 'application/json'
  })
}

async function isResponseUnauthenticated(response: Response): Promise<boolean> {
  if (response.status !== 401) return false

  if (await refreshAccessToken()) return true

  await handleUnauthenticated()
  errorService.reportError('Session expired - logging out')
  return true
}

async function handleNonOkResponse(response: Response): Promise<never> {
  const message = await extractErrorMessage(response)
  errorService.reportError(message)
  throw new Error(message)
}

async function fetchPost<T>(url: string, body: T, headers: HeadersInit): Promise<Response> {
  let response: Response | null = null
  try {
    response = await fetch(API_CONFIG.baseUrl + url, {
      method: 'POST',
      headers: headers,
      body: body instanceof FormData ? body : JSON.stringify(body)
    })
  } catch (error) {
    errorService.reportError('Network error — could not reach server')
    throw error
  }

  if (await isResponseUnauthenticated(response)) {
    return response
  }

  if (!response.ok) {
    await handleNonOkResponse(response)
  }

  return response
}

async function fetchPatch<T>(url: string, body: T, headers: HeadersInit): Promise<Response> {
  let response: Response | null = null
  try {
    response = await fetch(API_CONFIG.baseUrl + url, {
      method: 'PATCH',
      headers,
      body: body instanceof FormData ? body : JSON.stringify(body)
    })
  } catch (error) {
    errorService.reportError('Network error — could not reach server')
    throw error
  }

  if (await isResponseUnauthenticated(response)) {
    return response
  }

  if (!response.ok) {
    await handleNonOkResponse(response)
  }

  return response
}

async function fetchPut<T>(url: string, body: T, headers: HeadersInit): Promise<Response> {
  let response: Response | null = null
  try {
    response = await fetch(API_CONFIG.baseUrl + url, {
      method: 'PUT',
      headers,
      body: body instanceof FormData ? body : JSON.stringify(body)
    })
  } catch (error) {
    errorService.reportError('Network error — could not reach server')
    throw error
  }

  if (await isResponseUnauthenticated(response)) {
    return response
  }

  if (!response.ok) {
    await handleNonOkResponse(response)
  }

  return response
}

async function fetchDelete<T>(url: string, body: T, headers: HeadersInit): Promise<Response> {
  let response: Response | null = null
  try {
    response = await fetch(API_CONFIG.baseUrl + url, {
      method: 'DELETE',
      headers,
      body: JSON.stringify(body)
    })
  } catch (error) {
    errorService.reportError('Network error — could not reach server')
    throw error
  }

  if (await isResponseUnauthenticated(response)) {
    return response
  }

  if (!response.ok) {
    await handleNonOkResponse(response)
  }

  return response
}

async function fetchGet(url: string, headers: HeadersInit): Promise<Response> {
  let response: Response | null = null
  try {
    response = await fetch(API_CONFIG.baseUrl + url, {
      method: 'GET',
      headers
    })
  } catch (error) {
    errorService.reportError('Network error — could not reach server')
    throw error
  }

  if (await isResponseUnauthenticated(response)) {
    return response
  }

  if (!response.ok) {
    await handleNonOkResponse(response)
  }

  return response
}

async function extractErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json()
    return body.detail ?? body.message ?? `Error ${response.status}`
  } catch {
    return `Error ${response.status}`
  }
}
