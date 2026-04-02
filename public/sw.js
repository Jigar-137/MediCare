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
        return clients.openWindow('/dashboard.html');
      }
    })
  );
});

self.addEventListener('message', (event) => {
  if (!event.data) return;
  
  if (event.data.type === 'SET_ALARM') {
    const { id, timestamp, title, body, icon } = event.data;
    // Replace existing alarm with same id
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
  
  // Poll every 5 seconds. Each alarm fires exactly ONCE then is removed.
  // The 'tag' on the notification prevents OS-level duplicates for the same alarm.
  alarmTimer = setInterval(() => {
    const now = Date.now();
    const triggered = alarms.filter(a => now >= a.timestamp);

    if (triggered.length === 0) return;

    // Remove triggered alarms BEFORE showing notification to prevent double-firing
    const triggeredIds = triggered.map(a => a.id);
    alarms = alarms.filter(a => !triggeredIds.includes(a.id));

    // Show browser notification for each alarm (tag prevents OS duplicates)
    triggered.forEach(alarm => {
      self.registration.showNotification(alarm.title || 'MediCare \u23f0 Reminder', {
        body: alarm.body || 'Medicine reminder',
        vibrate: [300, 100, 300],
        tag: alarm.id
      });
    });

    // Notify open clients so they play buzzer + voice
    self.clients.matchAll({ includeUncontrolled: true }).then(clients => {
      clients.forEach(client => {
        client.postMessage({ type: 'ALARM_TRIGGERED', ids: triggeredIds });
      });
    });

    // Stop polling when no more alarms are pending
    if (alarms.length === 0) {
      clearInterval(alarmTimer);
      alarmTimer = null;
    }
  }, 5000);
}
