/* public/firebase-messaging-sw.js */

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');


const firebaseConfig = {
  apiKey: "AIzaSyCE6uu63O91LA5eCfKKIz6n5_dHWm4nwpw",
  authDomain: "videocall-174e6.firebaseapp.com",
  projectId: "videocall-174e6",
  storageBucket: "videocall-174e6.firebasestorage.app",
  messagingSenderId: "965109245557",
  appId: "965109245557:web:eb5e5c760d3b41dbda7a3c",
};

firebase.initializeApp(firebaseConfig);


const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};
  const notificationTitle = data.title || 'Incoming Consultation Call';
  const notificationOptions = {
    body: data.body || 'You have an incoming consultation call.',
    icon: '/favicon.ico',
    tag: `call-${data.call_id || Date.now()}`,
    renotify: true,
    requireInteraction: true,
    data: {
      url: self.location.origin,
      call_id: data.call_id,
      appointment_id: data.appointment_id,
      action: data.action,
      call_details: data.call_details
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Robust notification click handler to focus or open window
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || self.location.origin;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.host) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});