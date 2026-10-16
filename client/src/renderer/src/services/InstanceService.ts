import { API_CONFIG } from '$src/shared/config'
import type { InstanceInfo } from '$src/interfaces/Instance'
import { instanceState } from '$src/states/InstanceState.svelte'

class InstanceService {
  private loading: Promise<InstanceInfo | null> | null = null

  load(): Promise<InstanceInfo | null> {
    if (instanceState.info) return Promise.resolve(instanceState.info)
    return this.fetchInfo()
  }

  /** Fetches the info again, e.g. after an admin changed the name or registration mode. */
  reload(): Promise<InstanceInfo | null> {
    return this.fetchInfo()
  }

  // Links people share are built from the instance's public URL, never from the page origin,
  // so they are right behind a proxy and from inside the desktop shell. The info is loaded at
  // boot; the origin is only a fallback for an instance that couldn't be reached.
  publicLink(path: string): string {
    const base = (instanceState.info?.publicUrl ?? window.location.origin).replace(/\/+$/, '')
    return `${base}${path.startsWith('/') ? path : `/${path}`}`
  }

  private fetchInfo(): Promise<InstanceInfo | null> {
    if (this.loading) return this.loading
    this.loading = fetch(`${API_CONFIG.baseUrl}instance`)
      .then(async (response) => {
        if (!response.ok) return instanceState.info
        const info: InstanceInfo = await response.json()
        instanceState.info = info
        return info
      })
      .catch(() => instanceState.info)
      .finally(() => {
        this.loading = null
      })
    return this.loading
  }
}

export const instanceService = new InstanceService()
