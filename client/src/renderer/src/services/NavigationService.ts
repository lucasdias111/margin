import { View } from '$src/interfaces/View'
import { navigationState } from '$src/states/NavigationState.svelte'

class NavigationService {
  setView(view: View): void {
    navigationState.view = view
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
