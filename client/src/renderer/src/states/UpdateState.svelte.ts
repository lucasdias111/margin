class UpdateState {
  updateAvailable = $state(false)
  updateDownloaded = $state(false)
  version = $state('')
  downloading = $state(false)
}

export const updateState = new UpdateState()
