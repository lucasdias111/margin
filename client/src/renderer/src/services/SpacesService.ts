import type { CreateSpace, Space, SpaceMember } from '$src/interfaces/Space'
import { authenticatedGet, authenticatedPost } from '$src/services/api'
import type { Channel, CreateChannel } from '$src/interfaces/Channel'
import { spaceState } from '$src/states/SpaceState.svelte'

class SpacesService {
  async getAllSpacesForMargin(marginId: number): Promise<Space[]> {
    const response = await authenticatedGet(`spaces/get_all_spaces_for_margin/${marginId}`)
    if (!response.ok) throw new Error(`Failed to get spaces: ${response.status}`)
    return response.json()
  }

  async getAllSpacesForUser(marginId: number): Promise<void> {
    const response = await authenticatedGet(`spaces/get_all_spaces_for_user/${marginId}`)
    if (!response.ok) throw new Error(`Failed to get spaces for user: ${response.status}`)
    const spaces: Promise<Space[]> = response.json()
    spaceState.setSpaces(await spaces)
  }

  async addSpace(space: CreateSpace): Promise<Space> {
    const response = await authenticatedPost(space, 'spaces/create_space')
    if (!response.ok) throw new Error(`Failed to create space: ${response.status}`)
    return response.json()
  }

  async updateSpaceInfo(space: Space): Promise<Space> {
    const response = await authenticatedPost(space, 'spaces/update_space_info')
    if (!response.ok) throw new Error(`Failed to update space: ${response.status}`)
    return response.json()
  }

  async deleteSpace(space: Space): Promise<void> {
    const response = await authenticatedPost(space, 'spaces/delete_space')
    if (!response.ok) throw new Error(`Failed to delete space: ${response.status}`)
  }

  async addSpaceMemberToSpace(newSpaceMember: SpaceMember): Promise<SpaceMember> {
    const response = await authenticatedPost(newSpaceMember, 'spaces/add_space_member')
    if (!response.ok) throw new Error(`Failed to add space member: ${response.status}`)
    return response.json()
  }

  async createChannel(channel: CreateChannel): Promise<Channel> {
    const response = await authenticatedPost(channel, 'channels/create_channel')
    if (!response.ok) throw new Error(`Failed to create channel: ${response.status}`)
    return response.json()
  }

  async updateChannel(channel: Channel): Promise<Channel> {
    const response = await authenticatedPost(channel, 'channels/update_channel')
    if (!response.ok) throw new Error(`Failed to update channel: ${response.status}`)
    return response.json()
  }

  async deleteChannel(channel: Channel): Promise<void> {
    const response = await authenticatedPost(channel.id, 'channels/delete_channel')
    if (!response.ok) throw new Error(`Failed to delete channel: ${response.status}`)
  }

  async updateSpaceMemberRole(spaceMember: SpaceMember): Promise<SpaceMember> {
    const response = await authenticatedPost(spaceMember, 'spaces/update_space_member_role')
    if (!response.ok) throw new Error(`Failed to update space member role: ${response.status}`)
    return response.json()
  }

  async fetchVoiceParticipantsForSpace(space: Space): Promise<void> {
    await Promise.all(
      space.channels.map(async (c) => {
        const res = await authenticatedGet(`sfu/voice_participants/${c.id}`)
        c.voiceParticipants = res.ok ? await res.json() : []
      })
    )
  }
}

export const spacesService = new SpacesService()
