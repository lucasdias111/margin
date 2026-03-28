import { API_CONFIG } from '$src/shared/config'
import { errorService } from '$src/services/ErrorService'

export async function authenticatedGet(url: string): Promise<Response> {
  const token = sessionStorage.getItem('authToken')

  if (!token) {
    errorService.reportError('Token is required')
  }

  return fetch(API_CONFIG.baseUrl + url, {
    headers: {
      'Content-Type': 'application/json',
      method: 'GET',
      Authorization: `Bearer ${token}`
    }
  })
}

export async function authenticatedPost<T>(body: T, url: string): Promise<Response> {
  const token = sessionStorage.getItem('authToken')

  if (!token) {
    errorService.reportError('Token is required')
  }
  return fetchPost(url, body, {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  })
}

export async function authenticatedPostForm(formData: FormData, url: string): Promise<Response> {
  const token = sessionStorage.getItem('authToken')

  if (!token) {
    errorService.reportError('No token found')
  }
  return fetchPost(url, formData, {
    Authorization: `Bearer ${token}`
  })
}

export async function authenticatedPatchForm(formData: FormData, url: string): Promise<Response> {
  const token = sessionStorage.getItem('authToken')

  if (!token) {
    errorService.reportError('No token found')
  }
  return fetchPatch(url, formData, {
    Authorization: `Bearer ${token}`
  })
}

export async function unauthenticatedPost<T>(body: T, url: string): Promise<Response> {
  return fetchPost(url, body, {
    'Content-Type': 'application/json'
  })
}

async function fetchPost<T>(url: string, body: T, headers: HeadersInit): Promise<Response> {
  let response = null
  try {
    response = await fetch(API_CONFIG.baseUrl + url, {
      method: 'POST',
      headers: headers,
      body: body instanceof FormData ? body : JSON.stringify(body)
    })
  } catch (error) {
    errorService.reportError('Failed to fetch: ' + error)
  }
  if (!response) errorService.reportError('Error fetching')
  if (!response.ok)
    errorService.reportError('Error fetching: ' + response.status + response.statusText)
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

  if (!response.ok) {
    const message = await extractErrorMessage(response)
    errorService.reportError(message)
  }

  return response
}

export async function authenticatedDelete<T>(body: T, url: string): Promise<Response> {
  const token = sessionStorage.getItem('authToken')

  if (!token) {
    errorService.reportError('Token is required')
  }

  return fetchDelete(url, body, {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  })
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

  if (!response.ok) {
    const message = await extractErrorMessage(response)
    errorService.reportError(message)
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
