import type { Channel } from '$src/interfaces/Channel'
import type { User } from '$src/interfaces/User'
import { spaceState } from '$src/states/SpaceState.svelte'
import { authenticatedGet } from '$src/services/api'
import { navigationState } from '$src/states/NavigationState.svelte'
import { usersState } from '$src/states/UsersState.svelte'

class ChannelService {
  select(channel: Channel | null): void {
    navigationState.selectedChannel = channel
  }

  async getChannelById(channelId: number): Promise<Channel> {
    const response = await authenticatedGet('channels/' + channelId)
    return await response.json()
  }

  updateVoiceParticipant(channelId: number, user: User, joined: boolean): void {
    if (joined) usersState.add(user)
    for (const space of spaceState.spaces) {
      const channel = space.channels?.find((c) => c.id === channelId)
      if (channel) {
        channel.voiceParticipants = joined
          ? [...(channel.voiceParticipants ?? []).filter((p) => p.id !== user.id), user]
          : (channel.voiceParticipants ?? []).filter((p) => p.id !== user.id)
        if (navigationState.selectedChannel?.id === channelId) {
          navigationState.selectedChannel = {
            ...navigationState.selectedChannel,
            voiceParticipants: channel.voiceParticipants
          }
        }
        return
      }
    }
  }
}

export const channelService = new ChannelService()
