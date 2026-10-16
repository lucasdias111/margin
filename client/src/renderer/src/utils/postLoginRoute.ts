// A page that needs a signed-in user (an invite link, say) remembers itself here before
// sending someone to sign in or register; signing in then returns them to it.
const KEY = 'postLoginRoute'

export function rememberPostLoginRoute(route: string): void {
  sessionStorage.setItem(KEY, route)
}

export function takePostLoginRoute(): string {
  const route = sessionStorage.getItem(KEY)
  sessionStorage.removeItem(KEY)
  return route && route.startsWith('/') ? route : '/home'
}
