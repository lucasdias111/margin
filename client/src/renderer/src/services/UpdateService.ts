import { updateState } from '$src/states/UpdateState.svelte'

class UpdateService {
  setVersion(version: string): void {
    updateState.version = version
  }

  setUpdateAvailable(available: boolean): void {
    updateState.updateAvailable = available
  }

  setIsDownloading(isDownloading: boolean): void {
    updateState.downloading = isDownloading
  }

  hasUpdateDownloaded(hasUpdateDownloaded: boolean): void {
    updateState.updateDownloaded = hasUpdateDownloaded
  }
}

export const updateService = new UpdateService()
