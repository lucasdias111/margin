import type { Space } from '$src/interfaces/Space';
import type { User } from '$src/interfaces/User';
import type { ChatViewType } from '$src/interfaces/Content';
import type { Channel } from '$src/interfaces/Channel';

class ChatState {
  selectedUser = $state<User | null>(null);
  selectedSpace = $state<Space | null>(null);
  selectedChannel = $state<Channel | null>(null);
  currentlySelectedContent =  $state<ChatViewType | null>(null);
  
  selectUser(user: User) {
    this.selectedUser = user;
  }

  selectSpace(space: Space) {
    this.selectedSpace = space;
  }

  selectContent(content: ChatViewType) {
    this.currentlySelectedContent = content;
  }

  selectChannel(channel: Channel) {
    this.selectedChannel = channel;
  }
}

export const chatState = new ChatState();