import type { Space } from '$src/interfaces/Space'
import type { User } from '$src/interfaces/User'
import type { ContentType } from '$src/interfaces/Content'
import type { Channel } from '$src/interfaces/Channel'

class ChatState {
  selectedUser = $state<User | null>(null)
  selectedSpace = $state<Space | null>(null)
  selectedChannel = $state<Channel | null>(null)
  currentlySelectedContent = $state<ContentType | null>('private')

  selectUser(user: User): void {
    this.selectedUser = user
  }

  selectSpace(space: Space): void {
    this.selectedSpace = space
  }

  selectContent(content: ContentType): void {
    this.currentlySelectedContent = content
  }

  selectChannel(channel: Channel): void {
    this.selectedChannel = channel
  }

  reset(): void {
    this.selectedUser = null
    this.selectedSpace = null
    this.selectedChannel = null
    this.currentlySelectedContent = null
  }

  selectPrivateChatContent() : void{
    if (chatState.currentlySelectedContent !== 'private') {
      chatState.currentlySelectedContent = 'private'
    }
  }
}

export const chatState = new ChatState()
