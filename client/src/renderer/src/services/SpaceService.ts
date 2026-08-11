import type { CreateSpace, Space, SpaceMember } from '$src/interfaces/Space'
import { authenticatedDelete, authenticatedGet, authenticatedPost } from '$src/services/api'
import type { Channel, CreateChannel } from '$src/interfaces/Channel'
import { spaceState } from '$src/states/SpaceState.svelte'
import type { User } from '$src/interfaces/User'
import { navigationState } from '$src/states/NavigationState.svelte'
import { usersState } from '$src/states/UsersState.svelte'
import { conversationsState } from '$src/states/ConversationsState.svelte'

class SpaceService {
  select(space: Space): void {
    navigationState.selectedSpace = space
  }

  async getAllSpacesForMargin(marginId: number): Promise<Space[]> {
    const response = await authenticatedGet(`spaces/get_all_spaces_for_margin/${marginId}`)
    return response.json()
  }

  async getAllSpacesForUser(marginId: number): Promise<void> {
    const response = await authenticatedGet(`spaces/get_all_spaces_for_user/${marginId}`)
    const spaces: Space[] = await response.json()
    this.hydrateUsers(spaces)
    this.indexChannelMargins(spaces, marginId)
    spaceState.setSpaces(spaces)
  }

  private hydrateUsers(spaces: Space[]): void {
    for (const space of spaces) {
      for (const member of space.members) usersState.add(member.user)
      for (const channel of space.channels ?? []) {
        for (const user of channel.voiceParticipants ?? []) usersState.add(user)
      }
    }
  }

  private indexChannelMargins(spaces: Space[], marginId: number): void {
    for (const space of spaces) {
      for (const channel of space.channels ?? []) {
        conversationsState.setMarginForConversation(channel.conversationId, marginId)
      }
    }
  }

  async createSpace(space: CreateSpace): Promise<Space | null> {
    const response = await authenticatedPost(space, 'spaces/create_space')
    if (!response.ok) return null
    return response.json()
  }

  async updateSpaceInfo(space: Space): Promise<Space> {
    const response = await authenticatedPost(space, 'spaces/update_space_info')
    if (!response.ok) return null
    return response.json()
  }

  async deleteSpace(space: Space): Promise<void> {
    await authenticatedDelete(space, 'spaces/delete_space')
  }

  async addSpaceMemberToSpace(newSpaceMember: SpaceMember): Promise<SpaceMember> {
    const response = await authenticatedPost(newSpaceMember, 'spaces/add_space_member')
    if (!response.ok) return null
    return response.json()
  }

  async createChannel(channel: CreateChannel): Promise<Channel> {
    const response = await authenticatedPost(channel, 'channels/create_channel')
    if (!response.ok) return null
    return response.json()
  }

  async updateChannel(channel: Channel): Promise<Channel> {
    const response = await authenticatedPost(channel, 'channels/update_channel')
    if (!response.ok) return null
    return response.json()
  }

  async deleteChannel(channel: Channel): Promise<void> {
    await authenticatedDelete(channel.id, 'channels/delete_channel')
  }

  async updateSpaceMemberRole(spaceMember: SpaceMember): Promise<SpaceMember> {
    const response = await authenticatedPost(spaceMember, 'spaces/update_space_member_role')
    if (!response.ok) return null
    return response.json()
  }

  async removeSpaceMember(member: SpaceMember): Promise<void> {
    await authenticatedDelete(member, 'spaces/remove_space_member')
  }

  addMemberToSpace(spaceId: number, user: User): void {
    usersState.add(user)
    const space = spaceState.spaces.find((s) => s.spaceId === spaceId)
    if (!space) return
    const alreadyExists = space.members.some((m) => m.user.id === user.id)
    if (alreadyExists) return
    const newMember: SpaceMember = {
      user,
      spaceId,
      role: 'MEMBER',
      joinedAt: new Date().toISOString()
    }
    space.members = [...space.members, newMember]
    spaceState.spaces = [...spaceState.spaces]
    if (navigationState.selectedSpace?.spaceId === spaceId) {
      navigationState.selectedSpace = { ...space, members: space.members }
    }
  }
}

export const spaceService = new SpaceService()
