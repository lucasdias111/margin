import type { Space } from '$src/interfaces/Space'
import type { User } from '$src/interfaces/User'
import type { ChatViewType } from '$src/interfaces/Content'
import type { Channel } from '$src/interfaces/Channel'

class ChatState {
  selectedUser = $state<User | null>(null)
  selectedSpace = $state<Space | null>(null)
  selectedChannel = $state<Channel | null>(null)
  currentlySelectedContent = $state<ChatViewType | null>(null)

  selectUser(user: User) {
    this.selectedUser = user
  }

  selectSpace(space: Space) {
    this.selectedSpace = space
  }

  selectContent(content: ChatViewType) {
    this.currentlySelectedContent = content
  }

  selectChannel(channel: Channel) {
    this.selectedChannel = channel
  }

  reset() {
    this.selectedUser = null
    this.selectedSpace = null
    this.selectedChannel = null
    this.currentlySelectedContent = null
  }

  selectPrivateChatContent() {
    if (chatState.currentlySelectedContent !== 'private') {
      chatState.currentlySelectedContent = 'private'
    }
  }
}

export const chatState = new ChatState()
