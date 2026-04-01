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
});
