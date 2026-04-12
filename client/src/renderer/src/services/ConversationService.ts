import type { Channel } from '$src/interfaces/Channel'
import { authenticatedGet } from '$src/services/api'

class ConversationService {
  async getChannelById(channelId: number): Promise<Channel> {
    const response = await authenticatedGet('channels/' + channelId)
    return await response.json()
  }
}

export const conversationService = new ConversationService()
