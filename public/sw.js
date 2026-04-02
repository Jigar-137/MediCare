let alarms = [];
let alarmTimer = null;

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      // Check if there is already a window/tab open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        let client = windowClients[i];
        if (client.url.includes('/') && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

self.addEventListener('message', (event) => {
  if (!event.data) return;
  
  if (event.data.type === 'SET_ALARM') {
    const { id, timestamp, title, body, icon } = event.data;
    alarms = alarms.filter(a => a.id !== id);
    if (timestamp) {
      alarms.push({ id, timestamp, title, body, icon });
    }
    startAlarmLoop();
  }
  
  if (event.data.type === 'CLEAR_ALARM') {
    alarms = alarms.filter(a => a.id !== event.data.id);
  }
});

function startAlarmLoop() {
  if (alarmTimer) clearInterval(alarmTimer);
  
  // A service worker might be suspended by the OS, but while it's active, 
  // checking every 10s is a cheap way to fire scheduled notifications reliably.
  alarmTimer = setInterval(() => {
    const now = Date.now();
    let triggered = [];
    
    alarms.forEach(alarm => {
      // Allow a tiny 1s margin to trigger
      if (now >= alarm.timestamp) {
        triggered.push(alarm.id);
        self.registration.showNotification(alarm.title, {
          body: alarm.body,
          icon: alarm.icon || '🏥',
          vibrate: [300, 100, 300]
        });
      }
    });

    if (triggered.length > 0) {
      alarms = alarms.filter(a => !triggered.includes(a.id));
      
      self.clients.matchAll().then(clients => {
        clients.forEach(client => client.postMessage({ type: 'ALARM_TRIGGERED', ids: triggered }));
      });
    }
  }, 10000); 
}
