const isProd = import.meta.env.PROD

const BASE_ADDRESS = isProd ? 'https://margin.chat' : 'http://localhost:8080'
const WS_ADDRESS = isProd ? 'wss://margin.chat' : 'ws://localhost:8081'
const SFU_ADDRESS = isProd ? 'wss://margin.chat' : 'ws://localhost:3000'

export const API_CONFIG = {
  baseUrl: `${BASE_ADDRESS}/api/`,
  wsUrl: `${WS_ADDRESS}/ws`,
  sfuUrl: isProd ? `${SFU_ADDRESS}/sfu` : SFU_ADDRESS
}

export const CONFIG = {
  apiKey: 'muiEMxF9FWTbqfYBdzOwOAG6ncFwFFMNRD6VPhezdrqyG620Q6IAJIYQLnjd1ZFJ',
  clientKey: 'margin'
}
