import { View } from '$src/interfaces/View'
import type { User } from '$src/interfaces/User'
import type { Margin } from '$src/interfaces/Margin'
import type { Channel } from '$src/interfaces/Channel'
import type { Space } from '$src/interfaces/Space'
import type { GroupConversation, ThreadConversation } from '$src/interfaces/Conversation'

export type ManageTab = 'Margin' | 'Spaces' | 'Subscription'

class NavigationState {
  private _view = $state<View | null>(View.Private)
  private _selectedUser = $state<User | null>(null)
  private _selectedGroupConversation = $state<GroupConversation | null>(null)
  private _selectedMargin = $state<Margin | null>(null)
  private _selectedSpace = $state<Space | null>(null)
  private _selectedChannel = $state<Channel | null>(null)
  private _selectedThread = $state<ThreadConversation | null>(null)
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
    if (value?.id !== this._selectedUser?.id) this._selectedThread = null
    this._selectedUser = value
  }

  get selectedGroupConversation(): GroupConversation | null {
    return this._selectedGroupConversation
  }

  set selectedGroupConversation(value: GroupConversation | null) {
    if (value?.id !== this._selectedGroupConversation?.id) this._selectedThread = null
    this._selectedGroupConversation = value
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
    if (value?.id !== this._selectedChannel?.id) this._selectedThread = null
    this._selectedChannel = value
  }

  get selectedThread(): ThreadConversation | null {
    return this._selectedThread
  }

  set selectedThread(value: ThreadConversation | null) {
    this._selectedThread = value
  }

  get manageTab(): ManageTab {
    return this._manageTab
  }

  set manageTab(value: ManageTab) {
    this._manageTab = value
  }
}

export const navigationState = new NavigationState()
