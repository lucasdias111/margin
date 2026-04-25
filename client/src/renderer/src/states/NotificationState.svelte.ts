import type { Notification } from '$src/interfaces/Notification'

class NotificationState {
  private state = $state<{
    notifications: Notification[]
    notificationsLoaded: boolean
  }>({
    notifications: [],
    notificationsLoaded: false
  })

  get notifications(): Notification[] {
    return this.state.notifications
  }

  get notificationsLoaded(): boolean {
    return this.state.notificationsLoaded
  }

  setNotifications(notifications: Notification[]): void {
    this.state.notifications = notifications
    this.state.notificationsLoaded = true
  }

  markNotificationSeen(notificationId: number): void {
    const notification = this.state.notifications.find((n) => n.notificationId === notificationId)
    if (notification) {
      notification.seen = true
    }
  }

  addNotification(notification: Notification): void {
    this.state.notifications = [notification, ...this.state.notifications]
  }

  getTotalUnseenNotifications(): number {
    return this.state.notifications.filter((n) => !n.seen).length
  }
}

export const notificationState = new NotificationState()
