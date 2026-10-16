// True inside the margin desktop shell, which exposes its bridge only to its own server's pages.
export const isDesktopShell = (): boolean =>
  typeof window !== 'undefined' && window.marginDesktop !== undefined
