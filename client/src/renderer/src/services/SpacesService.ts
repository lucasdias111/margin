import type { Space } from '$src/interfaces/Space'
import { authenticatedGet } from '$src/services/api'

class SpacesService {
  async getAllSpacesForServer(): Promise<Space[]> {
    try {
      const response = await authenticatedGet(`spaces/get_all_spaces`)
      if (!response.ok) throw new Error(`Request failed with status: ${response.status}`)
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error getting spaces:', error)
      return []
    }
  }
}

export const spacesService = new SpacesService();
