import type { User } from '$src/interfaces/User'
import type { ContentType } from '$src/interfaces/Content'
import type { Channel } from '$src/interfaces/Channel'
import type { Margin } from '$src/interfaces/Margin'
import { spaceState } from '$src/states/SpaceState.svelte'
import type { Space } from '$src/interfaces/Space'

class ChatState {
  selectedUser = $state<User | null>(null)
  selectedMargin = $state<Margin | null>(null)
  selectedChannel = $state<Channel | null>(null)
  currentlySelectedContent = $state<ContentType | null>('private')
  hasMargin = $state<boolean>(true)
  settingsPage = $state<boolean>(false)
  margins = $state<Margin[]>([])

  get selectedSpace(): Space | null {
    return spaceState.selectedSpace
  }

  selectSpace(space: Space | null): void {
    spaceState.setSelectedSpace(space)
  }

  selectUser(user: User): void {
    this.selectedUser = user
  }

  selectMargin(margin: Margin): void {
    this.selectedMargin = margin
    this.hasMargin = true
    this.selectedChannel = null
    spaceState.setSpaces([])
    spaceState.setSelectedSpace(null)
  }

  selectChannel(channel: Channel | null): void {
    this.selectedChannel = channel
  }

  reset(): void {
    this.selectedUser = null
    this.selectedMargin = null
    this.selectedChannel = null
    this.currentlySelectedContent = 'private'
    this.hasMargin = true
  }

  selectPrivateChatContent(): void {
    if (chatState.currentlySelectedContent !== 'private') {
      chatState.currentlySelectedContent = 'private'
    }
  }

  updateMarginDetails(
    marginId: number,
    name: string,
    description: string,
    iconUrl: string | null
  ): void {
    if (this.selectedMargin?.marginId === marginId) {
      this.selectedMargin.marginName = name
      this.selectedMargin.marginDescription = description
      this.selectedMargin.marginIconUrl = iconUrl
    }
    this.margins = this.margins.map((m) =>
      m.marginId === marginId
        ? { ...m, marginName: name, marginDescription: description, marginIconUrl: iconUrl }
        : m
    )
  }
}

export const chatState = new ChatState()
