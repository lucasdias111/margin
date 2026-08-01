import { onMount } from 'svelte'
import { notificationService } from '$src/services/NotificationService'
import { updateService } from '$src/services/UpdateService'
import { isElectron } from '$src/utils/platformUtils'

export function useElectronIntegration(onUserActive: () => void): void {
  onMount(() => {
    if (!isElectron()) return

    window.updater!.onUpdateAvailable((version: string) => {
      updateService.setVersion(version)
      updateService.setUpdateAvailable(true)
    })

    window.updater!.onUpdateDownloaded(() => {
      updateService.setIsDownloading(false)
      updateService.hasUpdateDownloaded(true)
    })

    window.updater!.onUpdateProgress((percent: number) => {
      updateService.setProgress(percent)
    })

    window.updater!.onUpdateError((message: string) => {
      updateService.setError(message)
    })

    window.updater!.notifyReady()

    window.electronAPI?.onUserStatusChange((status) => {
      if (status === 'active') onUserActive()
    })
  })

  $effect(() => {
    if (!isElectron()) return

    const total =
      notificationService.totalUnreadDirectMessages() +
      notificationService.totalUnreadChannelMessages()
    window.api!.setBadgeCount(total)
  })
}
