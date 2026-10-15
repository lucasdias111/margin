import { MarginRole } from '$src/interfaces/Margin'
import { View } from '$src/interfaces/View'
import { marginState } from '$src/states/MarginState.svelte'
import { navigationState } from '$src/states/NavigationState.svelte'
import { sessionState } from '$src/states/SessionState.svelte'

export type Placement = 'right' | 'left' | 'top' | 'bottom'

export type Step = {
  target: string
  title: string
  body: string
  placement: Placement
}

export type Flow = {
  id: string
  trigger: () => boolean
  steps: Step[]
}

function isAdminOrOwner(): boolean {
  const margin = navigationState.selectedMargin
  const userId = sessionState.currentUser?.id
  if (!margin || !userId) return false
  const role = margin.members.find((m) => m.user.id === userId)?.role
  return role === MarginRole.OWNER || role === MarginRole.ADMIN
}

export const flows: Flow[] = [
  {
    id: 'nav-intro',
    trigger: () => true,
    steps: [
      {
        target: '[data-tour="nav-private"]',
        title: 'Private chats',
        body: 'Direct messages with anyone you share a margin with live here.',
        placement: 'right'
      },
      {
        target: '[data-tour="nav-margin"]',
        title: 'Margins',
        body: 'Workspaces that bundle spaces and channels for a whole team.',
        placement: 'right'
      },
      {
        target: '[data-tour="avatar-btn"]',
        title: 'Profile & settings',
        body: 'Your profile, settings, and logout live behind your avatar.',
        placement: 'right'
      }
    ]
  },
  {
    id: 'private-intro',
    trigger: () => navigationState.view === View.Private,
    steps: [
      {
        target: '[data-tour="private-sidebar"]',
        title: 'Direct messages',
        body: 'Search for anyone you share a margin with, invite anyone to a conversation or pick a recent conversation. Messages are end-to-end encrypted.',
        placement: 'right'
      }
    ]
  },
  {
    id: 'margin-empty',
    trigger: () => navigationState.view === View.Margin && !marginState.isMemberOfAnyMargins,
    steps: [
      {
        target: '[data-tour="margin-empty-create"]',
        title: 'Create or join a margin',
        body: 'Create a new margin, or join an existing one with an invite code. Margins are the home for your organization',
        placement: 'top'
      }
    ]
  },
  {
    id: 'margin-joined',
    trigger: () => navigationState.view === View.Margin && marginState.isMemberOfAnyMargins,
    steps: [
      {
        target: '[data-tour="margin-switcher"]',
        title: 'Switch between margins',
        body: 'Each margin act as a separate workspace. Pick from the margins you are a member of here, join another with an invite code or create a new.',
        placement: 'right'
      },
      {
        target: '[data-tour="margin-spaces"]',
        title: 'Spaces & channels',
        body: 'A margin is made op of spaces (teams). Each space contain one or more channels. Click a space to expand its channels.',
        placement: 'right'
      }
    ]
  },
  {
    id: 'manage-intro',
    trigger: () => navigationState.view === View.Manage && isAdminOrOwner(),
    steps: [
      {
        target: '[data-tour="manage-tabs"]',
        title: 'Manage your margin',
        body: 'Here you can navigate the management of your margin. Info & members, manage spaces & channels, and (if you own the margin) handle billing.',
        placement: 'bottom'
      }
    ]
  },
  {
    id: 'manage-tab-margin',
    trigger: () =>
      navigationState.view === View.Manage &&
      navigationState.manageTab === 'Margin' &&
      isAdminOrOwner(),
    steps: [
      {
        target: '[data-tour="manage-tab-content-margin"]',
        title: 'Margin info & members',
        body: 'Manage basic margin info, change margin icon, generate invite links, and review or remove members.',
        placement: 'top'
      }
    ]
  },
  {
    id: 'manage-tab-spaces',
    trigger: () =>
      navigationState.view === View.Manage &&
      navigationState.manageTab === 'Spaces' &&
      isAdminOrOwner(),
    steps: [
      {
        target: '[data-tour="manage-tab-content-spaces"]',
        title: 'Spaces & channels',
        body: 'Create or edit spaces, add channels to them, and control who can see each space.',
        placement: 'top'
      }
    ]
  },
  {
    id: 'manage-tab-subscription',
    trigger: () =>
      navigationState.view === View.Manage &&
      navigationState.manageTab === 'Subscription' &&
      isAdminOrOwner(),
    steps: [
      {
        target: '[data-tour="manage-tab-content-subscription"]',
        title: 'Subscription & billing',
        body: "Review your plan, update payment details, and manage your margin's subscription.",
        placement: 'top'
      }
    ]
  }
]
