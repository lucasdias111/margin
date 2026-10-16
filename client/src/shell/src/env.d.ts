/// <reference types="svelte" />
/// <reference types="vite/client" />

import type { ShellApi } from '../../common/shell'

declare global {
  interface Window {
    shell: ShellApi
  }
}
