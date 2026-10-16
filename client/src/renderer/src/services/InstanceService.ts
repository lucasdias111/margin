import { API_CONFIG } from '$src/shared/config'
import type { InstanceInfo } from '$src/interfaces/Instance'
import { instanceState } from '$src/states/InstanceState.svelte'

class InstanceService {
  private loading: Promise<InstanceInfo | null> | null = null

  load(): Promise<InstanceInfo | null> {
    if (instanceState.info) return Promise.resolve(instanceState.info)
    if (this.loading) return this.loading
    this.loading = fetch(`${API_CONFIG.baseUrl}instance`)
      .then(async (response) => {
        if (!response.ok) return null
        const info: InstanceInfo = await response.json()
        instanceState.info = info
        return info
      })
      .catch(() => null)
      .finally(() => {
        this.loading = null
      })
    return this.loading
  }

  // Links people share are built from the instance's public URL, never from the page origin,
  // so they are right behind a proxy and from inside the desktop shell. The info is loaded at
  // boot; the origin is only a fallback for an instance that couldn't be reached.
  publicLink(path: string): string {
    const base = (instanceState.info?.publicUrl ?? window.location.origin).replace(/\/+$/, '')
    return `${base}${path.startsWith('/') ? path : `/${path}`}`
  }
}

export const instanceService = new InstanceService()
