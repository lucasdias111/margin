import { authenticatedGet, authenticatedPost } from '$src/services/api'
import { instanceState } from '$src/states/InstanceState.svelte'
import { isDesktopShell } from '$src/utils/platformUtils'

// Web Push through the instance's own VAPID keys: no FCM or APNs account is involved. Works in
// desktop and Android browsers and in iOS 16.4+ home-screen apps. The desktop shell has no push
// service and relies on in-page notifications instead.
class WebPushService {
  get supported(): boolean {
    return (
      !isDesktopShell() &&
      instanceState.webPushEnabled &&
      typeof navigator !== 'undefined' &&
      'serviceWorker' in navigator &&
      typeof window !== 'undefined' &&
      'PushManager' in window &&
      'Notification' in window
    )
  }

  registerWorker(): void {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
    if (isDesktopShell()) return
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  }

  async isSubscribed(): Promise<boolean> {
    if (!this.supported) return false
    const registration = await navigator.serviceWorker.getRegistration()
    return (await registration?.pushManager.getSubscription()) != null
  }

  /** Renews the subscription quietly after sign-in when the user already allowed notifications. */
  async resume(): Promise<void> {
    if (!this.supported || Notification.permission !== 'granted') return
    await this.subscribe().catch(() => false)
  }

  /** Asks for permission (call from a click: iOS insists) and subscribes this browser. */
  async enable(): Promise<boolean> {
    if (!this.supported) return false
    if ((await Notification.requestPermission()) !== 'granted') return false
    return this.subscribe()
  }

  async disable(): Promise<void> {
    if (!this.supported) return
    const registration = await navigator.serviceWorker.getRegistration()
    const subscription = await registration?.pushManager.getSubscription()
    if (!subscription) return
    await authenticatedPost(
      { platform: 'WEB', token: JSON.stringify(subscription) },
      'push/unregister'
    ).catch(() => {})
    await subscription.unsubscribe()
  }

  private async subscribe(): Promise<boolean> {
    const registration = await navigator.serviceWorker.ready
    let subscription = await registration.pushManager.getSubscription()
    if (!subscription) {
      const { publicKey }: { publicKey: string } = await (
        await authenticatedGet('push/web/public-key')
      ).json()
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64UrlToBytes(publicKey)
      })
    }
    const response = await authenticatedPost(
      { platform: 'WEB', token: JSON.stringify(subscription) },
      'push/register'
    )
    return response.ok
  }
}

export function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const base64 = (value + '='.repeat((4 - (value.length % 4)) % 4))
    .replace(/-/g, '+')
    .replace(/_/g, '/')
  const raw = atob(base64)
  const bytes = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)
  return bytes
}

export const webPushService = new WebPushService()
