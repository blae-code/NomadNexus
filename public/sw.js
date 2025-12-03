// public/sw.js - Placeholder Service Worker
// This file will handle push events and show notifications.
// For now, it's just a placeholder.

self.addEventListener('push', (event) => {
  const data = event.data.json();
  console.log('Push received:', data);

  const title = data.title || 'Nomad Nexus Alert';
  const options = {
    body: data.body || 'You have a new notification.',
    icon: data.icon || '/icons/default_icon.png', // Placeholder icon
    badge: data.badge || '/icons/default_badge.png', // Placeholder badge
    data: {
      url: data.url || '/', // URL to open when notification is clicked
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data.url;
  event.waitUntil(
    clients.openWindow(urlToOpen)
  );
});

self.addEventListener('install', (event) => {
  console.log('Service Worker installed.');
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated.');
  event.waitUntil(self.clients.claim());
});
