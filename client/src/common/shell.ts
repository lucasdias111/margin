// What the shell's main process tells its own UI (the tab bar and shell screens). The UI is a
// pure view of this state; it changes it only through the `window.shell` calls below.

export type TabStatus = 'loading' | 'ready' | 'failed'

export interface TabState {
  id: string
  name: string
  origin: string
  status: TabStatus
  error: string | null
  unread: number
}

export interface PickerSource {
  id: string
  name: string
  kind: 'screen' | 'window'
  thumbnail: string
}

export type ShellUpdateState =
  | { kind: 'none' }
  | { kind: 'available'; version: string; url: string; canInstall: boolean }
  | { kind: 'downloading'; version: string; percent: number }
  | { kind: 'ready'; version: string }

export interface ShellState {
  platform: string
  shellVersion: string
  maximized: boolean
  tabs: TabState[]
  activeId: string | null
  update: ShellUpdateState
  // A `margin://open` link for a server that isn't added yet.
  pendingLink: { url: string; origin: string } | null
  picker: { tabId: string; sources: PickerSource[] } | null
}

export type AddServerResult = { ok: true } | { ok: false; error: string }

export interface ShellApi {
  getState: () => Promise<ShellState>
  onState: (callback: (state: ShellState) => void) => void
  addServer: (url: string) => Promise<AddServerResult>
  removeServer: (id: string) => Promise<void>
  selectTab: (id: string) => void
  reloadTab: (id: string) => void
  // A shell screen (add server, settings) covers the active tab while it's open.
  setOverlay: (open: boolean) => void
  chooseSource: (id: string | null) => void
  dismissLink: () => void
  acceptUpdate: () => void
  installUpdate: () => void
  dismissUpdate: () => void
  minimize: () => void
  toggleMaximize: () => void
  close: () => void
}

// The tab bar's height; the server views sit below it.
export const TAB_BAR_HEIGHT = 40
