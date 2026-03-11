import type { Space } from '$src/interfaces/Space'
import { chatState } from '$src/states/ChatState.svelte'
import type { Channel } from '$src/interfaces/Channel'
import type { ChannelSidebarUser } from '$src/interfaces/ChannelSidebarUser'
import SettingsIcon from '$src/components/svg/SettingsIcon.svelte'

class ChannelSidebarState {
  selectedSpace: Space = $derived(chatState.selectedSpace)
  selectedChannel: Channel = $derived(chatState.selectedChannel)
  channelSidebarUserList: ChannelSidebarUser[] = $state<ChannelSidebarUser[]>()
  selectedSettings: SettingsIcon = $derived(chatState.settingsPage)
}

export const channelSidebarState = new ChannelSidebarState()
