import type { CreateSpace, Space, SpaceMember } from '$src/interfaces/Space'
import { authenticatedGet, authenticatedPost } from '$src/services/api'
import type { Channel, CreateChannel } from '$src/interfaces/Channel'

class SpacesService {
  async getAllSpacesForServer(): Promise<Space[]> {
    const response = await authenticatedGet('api/spaces/get_all_spaces')
    if (!response.ok) throw new Error(`Failed to get spaces: ${response.status}`)
    return response.json()
  }

  async getAllSpacesForUser(): Promise<Space[]> {
    const response = await authenticatedGet('api/spaces/get_all_spaces_for_user')
    if (!response.ok) throw new Error(`Failed to get spaces for user: ${response.status}`)
    return response.json()
  }

  async addSpace(space: CreateSpace): Promise<Space> {
    const response = await authenticatedPost(space, 'api/spaces/create_space')
    if (!response.ok) throw new Error(`Failed to create space: ${response.status}`)
    return response.json()
  }

  async updateSpaceInfo(space: Space): Promise<Space> {
    const response = await authenticatedPost(space, 'api/spaces/update_space_info')
    if (!response.ok) throw new Error(`Failed to update space: ${response.status}`)
    return response.json()
  }

  async deleteSpace(space: Space): Promise<void> {
    const response = await authenticatedPost(space.spaceId, 'api/spaces/delete_space')
    if (!response.ok) throw new Error(`Failed to delete space: ${response.status}`)
  }

  async addSpaceMemberToSpace(newSpaceMember: SpaceMember): Promise<SpaceMember> {
    const response = await authenticatedPost(newSpaceMember, 'api/spaces/add_space_member')
    if (!response.ok) throw new Error(`Failed to add space member: ${response.status}`)
    return response.json()
  }

  async createChannel(channel: CreateChannel): Promise<Channel> {
    const response = await authenticatedPost(channel, 'api/channels/create_channel')
    if (!response.ok) throw new Error(`Failed to create channel: ${response.status}`)
    return response.json()
  }

  async updateChannel(channel: Channel): Promise<Channel> {
    const response = await authenticatedPost(channel, 'api/channels/update_channel')
    if (!response.ok) throw new Error(`Failed to update channel: ${response.status}`)
    return response.json()
  }

  async deleteChannel(channel: Channel): Promise<void> {
    const response = await authenticatedPost(channel.id, 'api/channels/delete_channel')
    if (!response.ok) throw new Error(`Failed to delete channel: ${response.status}`)
  }

  async updateSpaceMemberRole(spaceMember: SpaceMember): Promise<SpaceMember> {
    const response = await authenticatedPost(spaceMember, 'api/spaces/update_space_member_role')
    if (!response.ok) throw new Error(`Failed to update space member role: ${response.status}`)
    return response.json()
  }
}

export const spacesService = new SpacesService()
