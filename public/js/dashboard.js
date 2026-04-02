// ── Dashboard Orchestrator ──
const SECTION_TITLES = {
  home: 'Dashboard', medicines: '💊 Medicines', symptoms: '🩺 Symptom Checker',
  appointments: '📅 Appointments', fitness: '🏃 Fitness', profile: '👤 Profile'
};

let currentSection = 'home';

// Auth guard
const token = localStorage.getItem('medicare_token');
if (!token) window.location.href = '/';

// ── Navigation ──
function navigateTo(section) {
  // Hide all panels
  document.querySelectorAll('.section-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.sidebar-nav-item').forEach(b => b.classList.remove('active'));

  // Show target panel
  const panel = document.getElementById(`section-${section}`);
  if (panel) panel.classList.add('active');

  // Activate nav item
  const navItem = document.querySelector(`[data-section="${section}"]`);
  if (navItem) navItem.classList.add('active');

  // Update title
  const titleEl = document.getElementById('topbar-title');
  if (titleEl) titleEl.textContent = SECTION_TITLES[section] || section;

  currentSection = section;
  closeSidebar();

  // Load data for section
  switch (section) {
    case 'home':         loadHomeStats(); break;
    case 'medicines':    loadMedicines(); break;
    case 'appointments': loadAppointments(); break;
    case 'fitness':      initFitness(); break;
    case 'profile':      loadProfile(); break;
    case 'symptoms':     initSymptomChips(); break;
  }
}

async function loadHomeStats() {
  renderHomeTips();
  try {
    const [medicines, appointments] = await Promise.all([
      apiFetch('/api/medicines').catch(() => []),
      apiFetch('/api/appointments').catch(() => [])
    ]);
    const statMed = document.getElementById('stat-medicines');
    const statAppt = document.getElementById('stat-appointments');
    if (statMed) statMed.textContent = medicines.length;
    if (statAppt) statAppt.textContent = appointments.length;
    updateMedBadge(medicines.length);
    updateApptBadge(appointments.filter(a => a.status === 'upcoming').length);
  } catch {}
  // Fitness stats from localStorage
  const stepsStat = document.getElementById('stat-steps');
  const waterStat = document.getElementById('stat-water');
  if (stepsStat) stepsStat.textContent = parseInt(localStorage.getItem('medicare_steps') || '0').toLocaleString();
  if (waterStat) waterStat.textContent = localStorage.getItem('medicare_water') || '0';
}

// ── Sidebar ──
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('open');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay')?.classList.remove('open');
}

// ── Logout ──
function logout() {
  if (!confirm('Are you sure you want to logout?')) return;
  localStorage.removeItem('medicare_token');
  localStorage.removeItem('medicare_user');
  speak('Goodbye! Stay healthy.');
  window.location.href = '/';
}

// ── Init ──
document.addEventListener('DOMContentLoaded', async () => {
  // Set language first
  const savedLang = localStorage.getItem('medicare_lang') || 'en';
  setLanguage(savedLang);

  // Load profile data (populates sidebar + welcome banner)
  await loadProfile();

  // Load home stats
  await loadHomeStats();

  // Set min date for appointments to today
  const apptDate = document.getElementById('appt-date');
  if (apptDate) apptDate.min = new Date().toISOString().split('T')[0];

  // Add keyboard shortcut: Ctrl+M for mic
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'm') { e.preventDefault(); toggleVoice(); }
  });

  // Navigate to section from URL hash if present
  const hash = window.location.hash.replace('#', '');
  if (hash && SECTION_TITLES[hash]) navigateTo(hash);

  // ── Global Service Worker Registration ──
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      console.log('Service Worker registered with scope:', registration.scope);
      // Ensure the Service Worker controls the page
      if (!navigator.serviceWorker.controller) {
        console.log('SW not controlling page, reloading...');
        window.location.reload();
      }
    }).catch((err) => {
      console.error('Service Worker registration failed:', err);
    });

    navigator.serviceWorker.addEventListener('message', event => {
      if (!event.data) return;
      if (event.data.type === 'ALARM_TRIGGERED') {
        const ids = event.data.ids || [];
        ids.forEach(id => {
          if (id.startsWith('medicine_') && typeof window.triggerMedicineVoiceAndBuzzer === 'function') {
            const medId = id.split('_')[1];
            window.triggerMedicineVoiceAndBuzzer(medId);
          }
        });
      }
    });
  }

  // Request Notification Permission early
  if (typeof Notification !== 'undefined' && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
    Notification.requestPermission();
  }
});

// ── Debug Helper MUST be global ──
window.triggerMedicineAlarmNow = function() {
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    new Notification('Medicine Reminder', { body: 'Take 500 mg Paracetamol now', icon: '🏥', vibrate: [300, 100, 300] });
  } else {
    showToast('Take 500 mg Paracetamol now', 'info', 6000);
  }
  
  if (typeof window.triggerMedicineVoiceAndBuzzer === 'function') {
    // Pass a fake object or ID so it knows what to say if it relies on ID.
    // Or we can just build a special handler.
    // Instead we can just write the direct logic:
    try { new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play(); } catch(e){}
    const voiceEnabled = localStorage.getItem('medicare_voice_alerts') !== 'off';
    if (voiceEnabled && typeof speak === 'function') {
      setTimeout(() => speak('Take 500 mg Paracetamol now'), 400);
    }
  }
};
