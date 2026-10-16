// Links the server builds and people share are real paths on the instance
// (`/meet/<code>`, `/setup?token=…`, `/reset-password/<token>`), but the app routes on the hash.
// On load a path link becomes the matching hash route, keeping its query.
export function hashRouteForPath(pathname: string, search: string, hash: string): string | null {
  if (hash.length > 1 || pathname === '/' || pathname === '/index.html') return null
  return `/#${pathname.replace(/\/+$/, '')}${search}`
}
