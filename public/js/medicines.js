// ── Medicines Module ──
let medicineTimers = {};

async function loadMedicines() {
  const list = document.getElementById('medicines-list');
  if (!list) return;
  list.innerHTML = `<div class="skeleton" style="height:80px;margin-bottom:12px"></div><div class="skeleton" style="height:80px;margin-bottom:12px"></div>`;

  // Sync voice toggle UI to the unified voice_enabled flag
  const voiceEnabled = localStorage.getItem('voice_enabled') !== 'false';
  const globalToggle = document.getElementById('global-voice-toggle');
  const alertToggle  = document.getElementById('voice-alerts-toggle');
  if (globalToggle) globalToggle.checked = voiceEnabled;
  if (alertToggle)  alertToggle.checked  = voiceEnabled;

  try {
    const medicines = await apiFetch('/api/medicines');
    window.activeMedicines = window.activeMedicines || {};
    medicines.forEach(m => window.activeMedicines[m.id] = m);
    renderMedicines(medicines);
    updateMedBadge(medicines.length);
    // Update home stats
    const statEl = document.getElementById('stat-medicines');
    if (statEl) statEl.textContent = medicines.length;
    // Schedule reminders
    medicines.forEach(m => scheduleReminder(m));
  } catch (err) {
    list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">💊</div><h3>Could not load medicines</h3><p>${err.message}</p></div>`;
  }
}

function renderMedicines(medicines) {
  const list = document.getElementById('medicines-list');
  if (!medicines.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">💊</div><h3>No medicines added yet</h3><p>Add your first medicine above to get started with reminders.</p></div>`;
    return;
  }
  const freqColors = { daily: 'primary', 'twice-daily': 'upcoming', weekly: 'mild', 'as-needed': 'moderate' };
  list.innerHTML = `<div class="medicine-grid">${medicines.map(m => `
    <div class="medicine-card" id="med-card-${m.id}">
      <div class="medicine-card-header">
        <div>
          <div class="medicine-name">💊 ${escHtml(m.name)}</div>
          <div class="medicine-dosage">${escHtml(m.dosage)}</div>
        </div>
        <span class="badge badge-${freqColors[m.frequency] || 'primary'}">${m.frequency}</span>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <div class="medicine-time">⏰ ${formatTime(m.time)}</div>
        ${m.notes ? `<span style="font-size:12px;color:var(--text-secondary);font-style:italic">${escHtml(m.notes)}</span>` : ''}
      </div>
      <div class="medicine-card-footer">
        <div style="font-size:12px;color:var(--text-secondary)">Added ${formatRelDate(m.created_at)}</div>
        <button class="btn btn-danger btn-sm" onclick="deleteMedicine(${m.id})">🗑️ Remove</button>
      </div>
    </div>
  `).join('')}</div>`;
}

async function addMedicine(e) {
  e.preventDefault();
  const btn = document.getElementById('add-med-btn');
  const name = document.getElementById('med-name').value.trim();
  const dosage = document.getElementById('med-dosage').value.trim();
  const time = document.getElementById('med-time').value;
  const frequency = document.getElementById('med-frequency').value;
  const notes = document.getElementById('med-notes').value.trim();
  btn.disabled = true; btn.textContent = 'Adding…';
  try {
    const med = await apiFetch('/api/medicines', { method: 'POST', body: JSON.stringify({ name, dosage, time, frequency, notes }) });
    showToast(`✅ ${name} added! Reminder set for ${formatTime(time)}`, 'success');
    // NOTE: No speak() here — voice is reserved for actual reminder alerts, not UI actions
    document.getElementById('medicine-form').reset();
    await loadMedicines();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '➕ <span>Add Medicine</span>';
  }
}

async function deleteMedicine(id) {
  if (!confirm('Remove this medicine and its reminder?')) return;
  try {
    await apiFetch(`/api/medicines/${id}`, { method: 'DELETE' });
    if (medicineTimers[id]) { clearTimeout(medicineTimers[id]); delete medicineTimers[id]; }
    const card = document.getElementById(`med-card-${id}`);
    if (card) { card.style.opacity = '0'; card.style.transform = 'scale(0.9)'; card.style.transition = '0.3s'; setTimeout(() => loadMedicines(), 300); }
    showToast('Medicine removed', 'info');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function scheduleReminder(medicine) {
  if (medicineTimers[medicine.id]) { clearTimeout(medicineTimers[medicine.id]); }
  const [h, m] = medicine.time.split(':').map(Number);
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
  if (target <= now) target.setDate(target.getDate() + 1);

  // Cache medicine data for the buzzer/voice trigger
  window.activeMedicines = window.activeMedicines || {};
  window.activeMedicines[medicine.id] = medicine;

  const cleanName = medicine.name.replace(/</g, '').replace(/>/g, '');
  const alarmPayload = {
    type: 'SET_ALARM',
    id: 'medicine_' + medicine.user_id + '_' + medicine.id,
    timestamp: target.getTime(),
    title: 'MediCare ⏰ Medicine Reminder',
    body: `Time to take your ${medicine.dosage} of ${cleanName}`,
    icon: '/icons/icon-192.png'   // real PNG path for mobile
  };

  // Push alarm to Service Worker (handles background notifications)
  if ('serviceWorker' in navigator) {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage(alarmPayload);
    } else {
      // SW not yet controlling the page — wait for it
      navigator.serviceWorker.ready.then(reg => {
        if (reg.active) reg.active.postMessage(alarmPayload);
      });
    }
  } else {
    // No SW support — fall back to setTimeout (foreground only)
    const delay = target - now;
    medicineTimers[medicine.id] = setTimeout(() => {
      window.triggerMedicineVoiceAndBuzzer(medicine.id);
    }, delay);
  }
}

window.triggerMedicineVoiceAndBuzzer = function(id) {
  const medicine = (window.activeMedicines && window.activeMedicines[id]) ? window.activeMedicines[id] : null;
  if (!medicine) return; 

  // Use dynamic user name (defined in ai.js); never hardcoded
  const dynUserName = (typeof getUserName === 'function') ? getUserName() : 'User';
  const cleanName = medicine.name.replace(/</g, '').replace(/>/g, ''); 
  const msg = `${dynUserName}, it's time to take your ${medicine.dosage} of ${cleanName}.`;

  const playAlerts = () => {
    // 1. OS Notification
    //    The SW already showed a notification if the page was in the background.
    //    We show one here only when the page is active AND permission is granted.
    const showOsNotif = () => {
      if (typeof Notification === 'undefined') return;
      if (Notification.permission === 'granted') {
        new Notification('MediCare ⏰ Medicine Reminder', {
          body: `Time to take your ${medicine.dosage} of ${cleanName}`,
          vibrate: [300, 100, 300],
          tag: 'medicine_' + medicine.user_id + '_' + medicine.id   // prevents duplicates when SW also fires
        });
      } else if (Notification.permission === 'default') {
        Notification.requestPermission().then(p => {
          if (p === 'granted') {
            new Notification('MediCare ⏰ Medicine Reminder', {
              body: `Time to take your ${medicine.dosage} of ${cleanName}`,
              tag: 'medicine_' + medicine.user_id + '_' + medicine.id
            });
          }
        });
      }
    };
    showOsNotif();

    // 2. UI Toast (always shown)
    showToast(`⏰ Reminder Triggered: Time to take ${medicine.dosage} ${cleanName}`, 'info', 8000);

    // 3. Buzzer sound — handles mobile autoplay securely via global unlock wrapper
    if (typeof window.playBuzzer === 'function') {
      window.playBuzzer();
    } else {
      try { new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play(); } catch (e) {}
    }

    // 4. Voice — only if voice_enabled and page is in foreground
    if (typeof speakReminderOnly === 'function') {
      setTimeout(() => speakReminderOnly(msg), 600);
    }
  };

  // If page is hidden, defer playback until it becomes visible
  if (document.visibilityState === 'visible') {
    playAlerts();
  } else {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        playAlerts();
        document.removeEventListener('visibilitychange', onVisibilityChange);
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
  }

  // Re-schedule for next day
  scheduleReminder(medicine);
};

// Request notification permission proactively on page load.
// Must be triggered by page load context (not a timer) for mobile browsers.
(function requestNotifPermission() {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission === 'default') {
    Notification.requestPermission().then(p => {
      console.log('[MediCare] Notification permission:', p);
    });
  }
})();

// ── Helpers ──
/**
 * toggleVoiceAlerts() — called by the voice toggle checkboxes.
 * Writes to the unified 'voice_enabled' key and keeps both toggles in sync.
 */
window.toggleVoiceAlerts = function() {
  const alertToggle  = document.getElementById('voice-alerts-toggle');
  const globalToggle = document.getElementById('global-voice-toggle');
  // Determine which toggle was just clicked
  const enabled = alertToggle ? alertToggle.checked : (globalToggle ? globalToggle.checked : true);
  if (typeof window.setVoiceEnabled === 'function') {
    window.setVoiceEnabled(enabled);
  }
}

function updateMedBadge(count) {
  const b = document.getElementById('med-badge'); if (b) b.textContent = count;
}
function formatTime(t) {
  if (!t) return '';
  const [hh, mm] = t.split(':');
  const h = parseInt(hh), ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${mm} ${ampm}`;
}
function formatRelDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr), now = new Date();
  const diff = Math.floor((now - d) / 86400000);
  if (diff === 0) return 'today';
  if (diff === 1) return 'yesterday';
  return `${diff} days ago`;
}
function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Debug / Demo Helper ──────────────────────────────────────────────────────
// Run window.testReminder() (or triggerReminderNow()) in the browser console
// to instantly test the full reminder flow: notification + buzzer + voice.
window.triggerReminderNow = window.testReminder = function(customMsg) {
  const name = (typeof getUserName === 'function') ? getUserName() : 'User';
  const message = customMsg || `${name}, it's time to take your medicine!`;

  // 1. Request permission if needed, then fire notification
  const fireNotification = () => {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission === 'granted') {
      new Notification('MediCare ⏰ Reminder', {
        body: message,
        vibrate: [300, 100, 300],
        tag: 'test-reminder'
      });
    }
  };

  if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
    Notification.requestPermission().then(p => { if (p === 'granted') fireNotification(); });
  } else {
    fireNotification();
  }

  // 2. Toast (always shown regardless of permission)
  showToast(`⏰ Reminder Triggered: ${message}`, 'info', 8000);

  // 3. Buzzer (foreground only on mobile wrapper)
  if (typeof window.playBuzzer === 'function') {
    window.playBuzzer();
  } else {
    try { new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play(); } catch (e) {}
  }

  // 4. Voice — respects global voice_enabled toggle
  if (typeof speakReminderOnly === 'function') {
    setTimeout(() => speakReminderOnly(message), 600);
  }

  console.log('[MediCare] testReminder() fired:', message);
};



