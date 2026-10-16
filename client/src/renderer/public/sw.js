// Web Push only: margin does no offline caching, so there is deliberately no fetch handler.
// The instance pushes only to users who have no live connection, so whatever arrives here is
// shown. The payload is the server's PushMessage: { title, body, data }.

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

self.addEventListener('push', (event) => {
  let message = {}
  try {
    message = event.data ? event.data.json() : {}
  } catch {
    message = { body: event.data ? event.data.text() : '' }
  }
  const data = message.data || {}
  event.waitUntil(
    self.registration.showNotification(message.title || 'margin', {
      body: message.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-24.png',
      // One notification per conversation, replaced as new messages arrive.
      tag: data.conversationId ? `conversation-${data.conversationId}` : undefined,
      data
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const open = windows.find((client) => new URL(client.url).origin === self.location.origin)
      return open ? open.focus() : self.clients.openWindow('/#/home')
    })
  )
})
