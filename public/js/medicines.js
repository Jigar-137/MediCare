// ── Medicines Module ──
let medicineTimers = {};

async function loadMedicines() {
  const list = document.getElementById('medicines-list');
  if (!list) return;
  list.innerHTML = `<div class="skeleton" style="height:80px;margin-bottom:12px"></div><div class="skeleton" style="height:80px;margin-bottom:12px"></div>`;
  
  const savedVoicePref = localStorage.getItem('medicare_voice_alerts');
  const toggleEl = document.getElementById('voice-alerts-toggle');
  if (toggleEl) toggleEl.checked = savedVoicePref !== 'off';

  try {
    const medicines = await apiFetch('/api/medicines');
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
    speak(`${name} added. Reminder set for ${formatTime(time)}.`);
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
  const delay = target - now;
  medicineTimers[medicine.id] = setTimeout(() => {
    const title = 'MediCare Reminder ⏰';
    const dynUserName = (typeof userName !== 'undefined') ? userName : 'Jigar';
    const cleanName = medicine.name.replace(/</g, '').replace(/>/g, ''); 
    const msg = `${dynUserName}, time to take ${medicine.dosage} ${cleanName} now.`;
    
    // UI Notification Toast
    showToast(`⏰ Time to take: ${medicine.dosage} ${cleanName}`, 'info', 6000);

    // Native Browser Notification
    if (Notification.permission === 'granted') {
      new Notification(title, { body: `Take ${medicine.dosage} ${cleanName}`, icon: '🏥' });
    }

    // Play Buzzer Sound
    try {
      new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play();
    } catch (e) { console.warn('Audio play failed', e); }

    // Text-To-Speech (Condition governed by UI toggle)
    const voiceEnabled = localStorage.getItem('medicare_voice_alerts') !== 'off';
    if (voiceEnabled && typeof speak === 'function') {
      // 400ms delay to let the buzzer chime fire before speaking
      setTimeout(() => speak(msg), 400);
    }

    // Re-schedule for next day
    scheduleReminder(medicine);
  }, delay);
}

// Request permission on load
if (typeof Notification !== 'undefined' && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
  Notification.requestPermission();
}

// ── Helpers ──
window.toggleVoiceAlerts = function() {
  const isEnabled = document.getElementById('voice-alerts-toggle').checked;
  localStorage.setItem('medicare_voice_alerts', isEnabled ? 'on' : 'off');
  showToast(`Voice alerts ${isEnabled ? 'enabled' : 'disabled'}`, 'info');
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
