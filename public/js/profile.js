// ── Profile Module ──
let profileEditMode = false;
let cachedProfile = null;

async function loadProfile() {
  const grid = document.getElementById('profile-grid');
  if (!grid) return;
  try {
    const p = await apiFetch('/api/profile');
    cachedProfile = p;
    renderProfile(p, false);
    // Update sidebar
    const initials = getInitials(p.name);
    const sidebarAvatar = document.getElementById('sidebar-avatar');
    const sidebarName = document.getElementById('sidebar-name');
    if (sidebarAvatar) sidebarAvatar.textContent = initials;
    if (sidebarName) sidebarName.textContent = p.name;
    // Profile hero
    const avatarLarge = document.getElementById('profile-avatar-large');
    const nameDisplay = document.getElementById('profile-name-display');
    const emailDisplay = document.getElementById('profile-email-display');
    if (avatarLarge) avatarLarge.textContent = initials;
    if (nameDisplay) nameDisplay.textContent = p.name;
    if (emailDisplay) emailDisplay.textContent = p.email;
    // Welcome banner
    const welcomeEl = document.getElementById('welcome-name');
    if (welcomeEl) welcomeEl.textContent = `Hello, ${p.name} 👋`;
    // Welcome date
    const welcomeDate = document.getElementById('welcome-date');
    if (welcomeDate) {
      const now = new Date();
      welcomeDate.textContent = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }
  } catch (err) {
    if (grid) grid.innerHTML = `<div class="empty-state"><div class="empty-state-icon">👤</div><h3>Could not load profile</h3><p>${err.message}</p></div>`;
  }
}

function renderProfile(p, editMode) {
  profileEditMode = editMode;
  const grid = document.getElementById('profile-grid');
  const btn = document.getElementById('edit-profile-btn');
  if (btn) btn.textContent = editMode ? '💾 Save Profile' : '✏️ Edit Profile';
  if (btn) btn.setAttribute('data-i18n', editMode ? 'save_profile' : 'edit_profile');

  const field = (label, key, val, type = 'text', options = null) => {
    if (!editMode) {
      return `<div class="profile-field">
        <label>${label}</label>
        <div class="field-value">${escHtml(val || '—')}</div>
      </div>`;
    }
    if (options) {
      return `<div class="profile-field">
        <label>${label}</label>
        <select id="profile-${key}" class="form-control">
          <option value="">Select…</option>
          ${options.map(o => `<option value="${o}" ${val === o ? 'selected' : ''}>${o}</option>`).join('')}
        </select>
      </div>`;
    }
    return `<div class="profile-field">
      <label>${label}</label>
      <input type="${type}" id="profile-${key}" class="form-control" value="${escHtml(val || '')}" placeholder="${label}">
    </div>`;
  };

  grid.innerHTML = `
    <div class="profile-section">
      <h3>👤 Personal Info</h3>
      ${field('Full Name', 'name', p.name)}
      ${field('Date of Birth', 'dob', p.dob, 'date')}
      ${field('Gender', 'gender', p.gender, 'text', ['Male', 'Female', 'Other', 'Prefer not to say'])}
      ${field('Emergency Contact', 'emergency_contact', p.emergency_contact)}
    </div>
    <div class="profile-section">
      <h3>🏥 Health Details</h3>
      ${field('Blood Group', 'blood_group', p.blood_group, 'text', ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])}
      ${field('Height (cm)', 'height', p.height, 'number')}
      ${field('Weight (kg)', 'weight', p.weight, 'number')}
      ${field('Allergies', 'allergies', p.allergies)}
    </div>
  `;
}

function toggleEditProfile() {
  if (profileEditMode) {
    saveProfile();
  } else {
    if (cachedProfile) renderProfile(cachedProfile, true);
  }
}

async function saveProfile() {
  const body = {
    name: document.getElementById('profile-name')?.value?.trim() || cachedProfile?.name,
    dob: document.getElementById('profile-dob')?.value || null,
    gender: document.getElementById('profile-gender')?.value || null,
    blood_group: document.getElementById('profile-blood_group')?.value || null,
    height: document.getElementById('profile-height')?.value || null,
    weight: document.getElementById('profile-weight')?.value || null,
    allergies: document.getElementById('profile-allergies')?.value || null,
    emergency_contact: document.getElementById('profile-emergency_contact')?.value || null,
  };
  try {
    await apiFetch('/api/profile', { method: 'PUT', body: JSON.stringify(body) });
    // Update stored user name
    const stored = JSON.parse(localStorage.getItem('medicare_user') || '{}');
    stored.name = body.name;
    localStorage.setItem('medicare_user', JSON.stringify(stored));
    showToast('✅ Profile saved!', 'success');
    await loadProfile();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function getInitials(name) {
  return (name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}
