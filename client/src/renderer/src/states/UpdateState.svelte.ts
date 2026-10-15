class UpdateState {
  updateAvailable = $state(false)
  updateDownloaded = $state(false)
  version = $state('')
  downloading = $state(false)
  progress = $state(0)
  error = $state<string | null>(null)
}

export const updateState = new UpdateState()
