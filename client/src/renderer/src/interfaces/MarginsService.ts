import type { Margin } from '$src/interfaces/Margin'
import { authenticatedGet } from '$src/services/api'

class MarginsService {
  async getMargins(): Promise<Margin[]> {
    const response = await authenticatedGet(`api/margins/get_margins`)
    if (!response.ok) throw new Error(`Request failed with status: ${response.status}`)
    return response.json()
  }
}
export const marginService = new MarginsService()
