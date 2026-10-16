export interface ContentPart {
  type: 'text' | 'link'
  content: string
  href?: string
}

const URL_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+)/g

export function parseLinks(text: string): ContentPart[] {
  return text.split(URL_REGEX).map((part) => {
    if (part.match(URL_REGEX)) {
      const href = part.startsWith('http') ? part : `https://${part}`
      return { type: 'link', content: part, href }
    }
    return { type: 'text', content: part }
  })
}

// Opens in a new browser tab; inside the desktop shell, off-origin links go to the system browser.
export function openExternalLink(e: MouseEvent, url: string): void {
  e.preventDefault()
  window.open(url, '_blank', 'noopener,noreferrer')
}
