import { onMount } from 'svelte'
import { notificationService } from '$src/services/NotificationService'
import { desktopBridge } from '$src/services/DesktopBridge'

// Resyncs when the user comes back after being idle or away, and keeps the desktop shell's
// unread badge current. Both work without the shell: presence falls back to page visibility.
export function useDesktopIntegration(onUserActive: () => void): void {
  onMount(() => {
    let wasAway = false
    return desktopBridge.onPresence((presence) => {
      if (presence !== 'active') {
        wasAway = true
        return
      }
      if (wasAway) onUserActive()
      wasAway = false
    })
  })

  $effect(() => {
    const total =
      notificationService.totalUnreadDirectMessages() +
      notificationService.totalUnreadChannelMessages()
    desktopBridge.setBadgeCount(total)
  })
}
