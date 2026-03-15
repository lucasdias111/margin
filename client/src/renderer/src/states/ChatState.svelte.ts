import type { User } from '$src/interfaces/User'
import type { ContentType } from '$src/interfaces/Content'
import type { Channel } from '$src/interfaces/Channel'
import type { Margin } from '$src/interfaces/Margin'
import type { Space } from '$src/interfaces/Space'
import { conversationState } from '$src/states/ConversationState.svelte'

class ChatState {
  selectedUser = $state<User | null>(null)
  selectedMargin = $state<Margin | null>(null)
  selectedSpace = $state<Space | null>(null)
  selectedChannel = $state<Channel | null>(null)
  currentlySelectedContent = $state<ContentType | null>('private')
  hasMargin = $state<boolean>(true)
  settingsPage = $state<boolean>(false)
  margins = $state<Margin[]>([])

  selectUser(user: User): void {
    this.selectedUser = user
  }

  selectMargin(margin: Margin): void {
    this.selectedMargin = margin
    this.hasMargin = true
    this.selectedSpace = null
    this.selectedChannel = null
  }

  selectContent(content: ContentType): void {
    if (this.currentlySelectedContent !== content) {
      this.selectedUser = null
      conversationState.clear()
    }
    this.currentlySelectedContent = content
    this.selectedChannel = null
  }

  selectChannel(channel: Channel): void {
    this.selectedChannel = channel
  }

  selectSpace(space: Space): void {
    this.selectedSpace = space
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
}

export const chatState = new ChatState()
