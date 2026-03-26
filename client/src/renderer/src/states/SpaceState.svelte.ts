import { chatState } from '$src/states/ChatState.svelte'
import type { Space, SpaceMember } from '$src/interfaces/Space'
import type { User } from '$src/interfaces/User'

class SpaceState {
  spaces = $state<Space[]>([])
  selectedSpace = $state<Space | null>(null)

  setSpaces(spaces: Space[]): void {
    this.spaces = spaces
  }

  updateVoiceParticipant(channelId: number, user: User, joined: boolean): void {
    for (const space of this.spaces) {
      const channel = space.channels?.find((c) => c.id === channelId)
      if (channel) {
        channel.voiceParticipants = joined
          ? [...(channel.voiceParticipants ?? []).filter((p) => p.id !== user.id), user]
          : (channel.voiceParticipants ?? []).filter((p) => p.id !== user.id)
        if (chatState.selectedChannel?.id === channelId) {
          chatState.selectedChannel = {
            ...chatState.selectedChannel,
            voiceParticipants: channel.voiceParticipants
          }
        }
        return
      }
    }
  }

  setSelectedSpace(space: Space | null): void {
    this.selectedSpace = space
  }

  addMemberToSpace(spaceId: number, user: User): void {
    const space = this.spaces.find((s) => s.spaceId === spaceId)
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
    this.spaces = [...this.spaces]
    if (this.selectedSpace?.spaceId === spaceId) {
      this.selectedSpace = { ...space, members: space.members }
    }
  }
}

export const spaceState = new SpaceState()
