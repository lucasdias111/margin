// The desktop shell registers margin:// and opens the link in the tab for its server, or offers
// to add that server. Shared links stay plain https so they work for everyone.
export function desktopOpenUrl(link: string): string {
  return `margin://open?url=${encodeURIComponent(link)}`
}
