import { sessionState } from '$src/states/SessionState.svelte'

export function nameWithCapInitials(): string {
  const names = sessionState.currentUser.displayName.split(' ')

  return names.map((word) => word[0].toUpperCase() + word.slice(1)).join(' ')
}
