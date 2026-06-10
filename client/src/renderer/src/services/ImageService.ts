import { authenticatedGet } from '$src/services/api'

class ImageService {
  private cache = new Map<string, Promise<string>>()

  async getAuthenticatedImageUrl(path: string): Promise<string> {
    if (!path) return path
    if (!path.includes('/api/')) return path

    const cached = this.cache.get(path)
    if (cached) return cached

    const promise = this.fetchObjectUrl(path)
    this.cache.set(path, promise)
    promise.catch(() => this.cache.delete(path))
    return promise
  }

  private async fetchObjectUrl(path: string): Promise<string> {
    const cleanPath = path.substring(path.indexOf('api/') + 4)
    const response = await authenticatedGet(cleanPath)
    if (!response.ok) throw new Error(`Image fetch failed (${response.status}): ${path}`)
    const blob = await response.blob()
    return URL.createObjectURL(blob)
  }
}

export const imageService = new ImageService()
