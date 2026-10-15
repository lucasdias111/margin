const isProd = import.meta.env.PROD

// In production the web app is served by the instance itself, so the API lives on the same origin.
const wsOrigin = (): string =>
  isProd ? `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}` : 'ws://localhost:8081'

export const API_CONFIG = {
  baseUrl: isProd ? '/api/' : 'http://localhost:8080/api/',
  get wsUrl(): string {
    return `${wsOrigin()}/ws`
  }
}

export const CONFIG = {
  apiKey: '',
  clientKey: 'margin'
}
