// const BASE_ADDRESS = '135.181.100.126'
const BASE_ADDRESS = 'localhost'

export const API_CONFIG = { // TODO: Make into ENV variables
  baseUrl: `http://${BASE_ADDRESS}:8080/`,
  wsUrl: `ws://${BASE_ADDRESS}:8081/`,
  sfuUrl: `ws://localhost:3000/`
}
