import { chatState } from '$src/states/ChatState.svelte'
import type { Space } from '$src/interfaces/Space'
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
}

export const spaceState = new SpaceState()
