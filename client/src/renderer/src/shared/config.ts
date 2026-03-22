const isProd = import.meta.env.PROD

const BASE_ADDRESS = isProd ? 'https://getmargin.online' : 'http://localhost:8080'
const WS_ADDRESS = isProd ? 'wss://getmargin.online' : 'ws://localhost:8081'
const SFU_ADDRESS = isProd ? 'wss://getmargin.online' : 'ws://localhost:3000'

export const API_CONFIG = {
  baseUrl: `${BASE_ADDRESS}/api/`,
  wsUrl: `${WS_ADDRESS}/ws`,
  sfuUrl: isProd ? `${SFU_ADDRESS}/sfu` : SFU_ADDRESS
}
