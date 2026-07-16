self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// Pass-through fetch handler — required by some browsers' install criteria.
// Not doing offline caching here; Chronicle needs a live connection anyway
// since all data lives in Supabase.
self.addEventListener('fetch', () => {})

self.addEventListener('push', (event) => {
  let data = { title: 'Reminder', body: 'You have an upcoming event.' }
  try {
    data = event.data.json()
  } catch (e) {
    // fall back to default text above
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(clients.openWindow('/'))
})
