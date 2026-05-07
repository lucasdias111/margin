import { View } from '$src/interfaces/View'
import type { User } from '$src/interfaces/User'
import type { Margin } from '$src/interfaces/Margin'
import type { Channel } from '$src/interfaces/Channel'
import type { Space } from '$src/interfaces/Space'

export type ManageTab = 'Margin' | 'Spaces' | 'Subscription'

class NavigationState {
  private _view = $state<View | null>(View.Private)
  private _selectedUser = $state<User | null>(null)
  private _selectedMargin = $state<Margin | null>(null)
  private _selectedSpace = $state<Space | null>(null)
  private _selectedChannel = $state<Channel | null>(null)
  private _manageTab = $state<ManageTab>('Margin')

  get view(): View {
    return this._view
  }

  set view(value: View) {
    this._view = value
  }

  get selectedUser(): User {
    return this._selectedUser
  }

  set selectedUser(value: User) {
    this._selectedUser = value
  }

  get selectedMargin(): Margin {
    return this._selectedMargin
  }

  set selectedMargin(value: Margin) {
    this._selectedMargin = value
  }

  get selectedSpace(): Space {
    return this._selectedSpace
  }

  set selectedSpace(value: Space) {
    this._selectedSpace = value
  }

  get selectedChannel(): Channel {
    return this._selectedChannel
  }

  set selectedChannel(value: Channel) {
    this._selectedChannel = value
  }

  get manageTab(): ManageTab {
    return this._manageTab
  }

  set manageTab(value: ManageTab) {
    this._manageTab = value
  }
}

export const navigationState = new NavigationState()
