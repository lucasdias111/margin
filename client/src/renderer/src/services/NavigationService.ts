import { View } from '$src/interfaces/View'
import { navigationState } from '$src/states/NavigationState.svelte'
import { channelService } from '$src/services/ChannelService'

class NavigationService {
  setView(view: View): void {
    navigationState.view = view
  }

  selectContent(content: View): void {
    if (navigationState.view !== content) {
      navigationState.selectedUser = null
      navigationState.selectedGroupConversation = null
    }
    navigationState.view = content
    channelService.select(null)
  }

  reset(): void {
    navigationState.view = View.Private
    navigationState.selectedUser = null
    navigationState.selectedChannel = null
    navigationState.selectedSpace = null
    navigationState.selectedMargin = null
  }
}

export const navigationService = new NavigationService()
