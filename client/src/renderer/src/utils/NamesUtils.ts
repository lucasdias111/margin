import { userState } from '$src/states/UserState.svelte'

export function nameWithCapInitials(): string {
  const names = userState.currentUser.displayName.split(' ')

  return names.map((word) => word[0].toUpperCase() + word.slice(1)).join(' ')
}
