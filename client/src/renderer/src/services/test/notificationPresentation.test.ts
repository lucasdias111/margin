import { describe, expect, it } from 'vitest'
import { NotificationType, type Notification } from '$src/interfaces/Notification'
import { notificationIcon, notificationTitle } from '$src/utils/notificationPresentation'

function notification(type: NotificationType, senderName?: string): Notification {
  return {
    notificationId: 1,
    type,
    seen: false,
    sender: senderName ? ({ displayName: senderName } as Notification['sender']) : null
  } as Notification
}

describe('notificationPresentation', () => {
  it('names a meeting that is starting now', () => {
    expect(notificationTitle(notification(NotificationType.MEETING_STARTED))).toBe(
      'A meeting you are invited to is starting now'
    )
  })

  it('names a meeting that starts in ten minutes', () => {
    expect(notificationTitle(notification(NotificationType.MEETING_REMINDER))).toBe(
      'A meeting you are invited to starts in 10 minutes'
    )
  })

  it('credits whoever sent a meeting invite', () => {
    expect(notificationTitle(notification(NotificationType.MEETING_INVITE, 'Nadia'))).toBe(
      'Nadia invited you to a meeting'
    )
  })

  it('gives every meeting notification the calendar icon', () => {
    const meetingTypes = [
      NotificationType.MEETING_INVITE,
      NotificationType.MEETING_REMINDER,
      NotificationType.MEETING_STARTED
    ]
    meetingTypes.forEach((type) => expect(notificationIcon(type)).toBe('📅'))
  })

  it('has a title and an icon for every type it can be handed', () => {
    Object.values(NotificationType).forEach((type) => {
      expect(notificationTitle(notification(type)), type).not.toBe('New notification')
      expect(notificationIcon(type), type).not.toBe('🔔')
    })
  })

  it('falls back rather than rendering blank for a type it does not know', () => {
    const unknown = 'SOMETHING_NEW' as NotificationType

    expect(notificationTitle(notification(unknown))).toBe('New notification')
    expect(notificationIcon(unknown)).toBe('🔔')
  })

  it('still names the older types it inherited', () => {
    expect(notificationTitle(notification(NotificationType.MISSED_CALL, 'Bob'))).toBe(
      'Missed call from Bob'
    )
    expect(notificationTitle(notification(NotificationType.THREAD_REPLY))).toBe(
      'Someone replied in a thread you follow'
    )
  })
})
