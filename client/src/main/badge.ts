import { app, BrowserWindow, nativeImage } from 'electron'
import notificationBadge from '../../resources/notification-badge.png?asset'

// Each tab reports its own unread count; the dock or taskbar shows the total.

export function totalUnread(counts: Iterable<number>): number {
  let total = 0
  for (const count of counts) {
    if (Number.isFinite(count) && count > 0) total += Math.floor(count)
  }
  return total
}

let badgeImage: Electron.NativeImage | null = null

export function applyBadge(win: BrowserWindow | null, count: number): void {
  if (process.platform === 'darwin') {
    app.dock?.setBadge(count > 0 ? String(count) : '')
  } else if (process.platform === 'linux') {
    app.setBadgeCount(count)
  } else if (process.platform === 'win32') {
    if (!win || win.isDestroyed()) return
    if (count > 0) {
      badgeImage ??= nativeImage.createFromPath(notificationBadge)
      win.setOverlayIcon(badgeImage, `${count} unread messages`)
    } else {
      win.setOverlayIcon(null, '')
    }
  }
}
