import { authenticatedGet } from '$src/services/api'

class ImageService {
  private cache = new Map<string, string>()

  async getAuthenticatedImageUrl(path: string): Promise<string> {
    const cached = this.cache.get(path)
    if (cached) return cached

    const cleanPath = path.includes('api/') ? path.substring(path.indexOf('api/') + 4) : path

    const response = await authenticatedGet(cleanPath)
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    this.cache.set(path, url)
    return url
  }

  invalidateImageCache(path: string): void {
    const url = this.cache.get(path)
    if (url) {
      URL.revokeObjectURL(url)
      this.cache.delete(path)
    }
  }
}

export const imageService = new ImageService()
