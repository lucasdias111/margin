import type { CreateSpace, Space, SpaceMember } from '$src/interfaces/Space'
import { authenticatedGet, authenticatedPost, authenticatedDelete } from '$src/services/api'
import type { Channel, CreateChannel } from '$src/interfaces/Channel'
import { spaceState } from '$src/states/SpaceState.svelte'

class SpacesService {
  async getAllSpacesForMargin(marginId: number): Promise<Space[]> {
    const response = await authenticatedGet(`spaces/get_all_spaces_for_margin/${marginId}`)
    return response.json()
  }

  async getAllSpacesForUser(marginId: number): Promise<void> {
    const response = await authenticatedGet(`spaces/get_all_spaces_for_user/${marginId}`)
    spaceState.setSpaces(await response.json())
  }

  async addSpace(space: CreateSpace): Promise<Space> {
    const response = await authenticatedPost(space, 'spaces/create_space')
    return response.json()
  }

  async updateSpaceInfo(space: Space): Promise<Space> {
    const response = await authenticatedPost(space, 'spaces/update_space_info')
    return response.json()
  }

  async deleteSpace(space: Space): Promise<void> {
    await authenticatedDelete(space, 'spaces/delete_space')
  }

  async addSpaceMemberToSpace(newSpaceMember: SpaceMember): Promise<SpaceMember> {
    const response = await authenticatedPost(newSpaceMember, 'spaces/add_space_member')
    return response.json()
  }

  async createChannel(channel: CreateChannel): Promise<Channel> {
    const response = await authenticatedPost(channel, 'channels/create_channel')
    return response.json()
  }

  async updateChannel(channel: Channel): Promise<Channel> {
    const response = await authenticatedPost(channel, 'channels/update_channel')
    return response.json()
  }

  async deleteChannel(channel: Channel): Promise<void> {
    await authenticatedDelete(channel.id, 'channels/delete_channel')
  }

  async updateSpaceMemberRole(spaceMember: SpaceMember): Promise<SpaceMember> {
    const response = await authenticatedPost(spaceMember, 'spaces/update_space_member_role')
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
