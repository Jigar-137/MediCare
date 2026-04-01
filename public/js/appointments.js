// ── Appointments Module ──
async function loadAppointments() {
  const list = document.getElementById('appointments-list');
  if (!list) return;
  list.innerHTML = `<div class="skeleton" style="height:90px;margin-bottom:12px"></div><div class="skeleton" style="height:90px;margin-bottom:12px"></div>`;
  try {
    const appointments = await apiFetch('/api/appointments');
    renderAppointments(appointments);
    updateApptBadge(appointments.filter(a => a.status === 'upcoming').length);
    const statEl = document.getElementById('stat-appointments');
    if (statEl) statEl.textContent = appointments.length;
  } catch (err) {
    list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📅</div><h3>Could not load appointments</h3><p>${err.message}</p></div>`;
  }
}

function renderAppointments(appointments) {
  const list = document.getElementById('appointments-list');
  if (!appointments.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📅</div><h3>No appointments booked</h3><p>Book your first appointment above and stay ahead of your health.</p></div>`;
    return;
  }
  const now = new Date();
  list.innerHTML = `<div class="timeline">${appointments.map((a, i) => {
    const apptDate = new Date(a.date + 'T' + a.time);
    const isPast = apptDate < now;
    return `
    <div class="timeline-item" id="appt-item-${a.id}">
      <div class="timeline-dot-col">
        <div class="timeline-dot" style="${isPast ? 'background:var(--text-light)' : ''}"></div>
        ${i < appointments.length - 1 ? '<div class="timeline-line"></div>' : ''}
      </div>
      <div class="timeline-card">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px">
          <div>
            <div class="timeline-doctor">👨‍⚕️ ${escHtml(a.doctor_name)}</div>
            <div class="timeline-spec">${escHtml(a.specialization || 'General Physician')}</div>
          </div>
          <span class="badge ${isPast ? 'badge-unknown' : 'badge-upcoming'}">${isPast ? 'Past' : 'Upcoming'}</span>
        </div>
        <div class="timeline-meta">
          <div class="timeline-meta-item"><span>📅</span>${formatApptDate(a.date)}</div>
          <div class="timeline-meta-item"><span>⏰</span>${formatTime(a.time)}</div>
          ${a.location ? `<div class="timeline-meta-item"><span>📍</span>${escHtml(a.location)}</div>` : ''}
        </div>
        ${a.notes ? `<div style="font-size:13px;color:var(--text-secondary);margin-top:8px;font-style:italic">📝 ${escHtml(a.notes)}</div>` : ''}
        <div style="margin-top:12px">
          <button class="btn btn-danger btn-sm" onclick="deleteAppointment(${a.id})">🗑️ Cancel</button>
        </div>
      </div>
    </div>`;
  }).join('')}</div>`;
}

async function addAppointment(e) {
  e.preventDefault();
  const btn = document.getElementById('add-appt-btn');
  const data = {
    doctor_name: document.getElementById('appt-doctor').value.trim(),
    specialization: document.getElementById('appt-spec').value,
    date: document.getElementById('appt-date').value,
    time: document.getElementById('appt-time').value,
    location: document.getElementById('appt-location').value.trim(),
    notes: document.getElementById('appt-notes').value.trim()
  };
  if (!data.doctor_name || !data.date || !data.time) {
    showToast('Please fill in all required fields', 'error'); return;
  }
  btn.disabled = true; btn.textContent = 'Booking…';
  try {
    await apiFetch('/api/appointments', { method: 'POST', body: JSON.stringify(data) });
    showToast(`✅ Appointment with ${data.doctor_name} booked for ${formatApptDate(data.date)}!`, 'success');
    speak(`Appointment booked with ${data.doctor_name} on ${formatApptDate(data.date)}.`);
    document.getElementById('appointment-form').reset();
    await loadAppointments();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '📅 <span>Book Appointment</span>';
  }
}

async function deleteAppointment(id) {
  if (!confirm('Cancel this appointment?')) return;
  try {
    await apiFetch(`/api/appointments/${id}`, { method: 'DELETE' });
    showToast('Appointment cancelled', 'info');
    await loadAppointments();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function formatApptDate(d) {
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', weekday: 'short' });
}

function updateApptBadge(count) {
  const b = document.getElementById('appt-badge'); if (b) b.textContent = count;
}
