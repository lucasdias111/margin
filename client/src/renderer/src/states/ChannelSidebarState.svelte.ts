import type { Space } from '$src/interfaces/Space'
import { chatState } from '$src/states/ChatState.svelte'
import type { Channel } from '$src/interfaces/Channel'
import type { ChannelSidebarUser } from '$src/interfaces/ChannelSidebarUser'

class ChannelSidebarState {
  selectedSpace: Space = $derived(chatState.selectedSpace)
  selectedChannel: Channel = $derived(chatState.selectedChannel)
  channelSidebarUserList: ChannelSidebarUser[] = $state<ChannelSidebarUser[]>()
}

export const channelSidebarState = new ChannelSidebarState()
