import { API_CONFIG } from '$src/shared/config'

export async function authenticatedGet(url: string): Promise<Response> {
  const token = sessionStorage.getItem('authToken')

  if (!token) {
    throw new Error('No authentication token found')
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
    throw new Error('No authentication token found')
  }

  return fetch(API_CONFIG.baseUrl + url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(body)
  })
}

export async function authenticatedPostForm(formData: FormData, url: string): Promise<Response> {
  const token = sessionStorage.getItem('authToken')

  if (!token) {
    throw new Error('No authentication token found')
  }

  return fetch(API_CONFIG.baseUrl + url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  })
}

export async function unauthenticatedPost<T>(body: T, url: string): Promise<Response> {
  return await fetch(API_CONFIG.baseUrl + url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })
}
