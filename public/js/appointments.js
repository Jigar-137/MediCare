// ── Appointments Module: Smart Booking Engine ──

const DOCTORS_DB = [
  // Ahmedabad
  { id: 1, name: "Dr. Rajesh Patel", spec: "Dentist", city: "Ahmedabad", exp: "12+ Years", rating: 4.8 },
  { id: 2, name: "Dr. Sneha Sharma", spec: "Cardiologist", city: "Ahmedabad", exp: "8+ Years", rating: 4.9 },
  { id: 3, name: "Dr. Amit Desai", spec: "General Physician", city: "Ahmedabad", exp: "15+ Years", rating: 4.7 },
  { id: 4, name: "Dr. Kavita Shah", spec: "Gynecologist", city: "Ahmedabad", exp: "10+ Years", rating: 4.6 },
  { id: 5, name: "Dr. Vikram Joshi", spec: "Orthopedist", city: "Ahmedabad", exp: "9+ Years", rating: 4.5 },
  // Mumbai
  { id: 6, name: "Dr. Arjun Kapoor", spec: "Dentist", city: "Mumbai", exp: "6+ Years", rating: 4.4 },
  { id: 7, name: "Dr. Meera Iyer", spec: "Cardiologist", city: "Mumbai", exp: "18+ Years", rating: 4.9 },
  { id: 8, name: "Dr. Rakesh Nair", spec: "General Physician", city: "Mumbai", exp: "11+ Years", rating: 4.6 },
  // Delhi
  { id: 9, name: "Dr. Anil Gupta", spec: "Neurologist", city: "Delhi", exp: "20+ Years", rating: 4.9 },
  { id: 10, name: "Dr. Priya Singh", spec: "Pediatrician", city: "Delhi", exp: "7+ Years", rating: 4.7 },
  { id: 11, name: "Dr. Ramesh Verma", spec: "Dentist", city: "Delhi", exp: "5+ Years", rating: 4.3 },
  // Bangalore
  { id: 12, name: "Dr. Kiran Reddy", spec: "General Physician", city: "Bangalore", exp: "14+ Years", rating: 4.8 },
  { id: 13, name: "Dr. Swati Rao", spec: "Ophthalmologist", city: "Bangalore", exp: "9+ Years", rating: 4.5 }
];

const ALL_SLOTS = ['10:00', '10:30', '11:00', '11:30', '12:00', '14:00', '14:30', '15:00', '16:00', '16:30', '17:00'];

let bookingState = {
  domain: '',
  city: 'Ahmedabad',
  doctorId: null,
  date: '',
  time: ''
};

// ── WIZARD UI LOGIC ──

function switchStep(stepNum) {
  document.querySelectorAll('.booking-step').forEach(el => el.style.display = 'none');
  const target = document.getElementById(`booking-step-${stepNum}`);
  if (target) {
    target.style.display = 'block';
    const ind = document.getElementById('booking-step-indicator');
    if(ind && stepNum <= 3) ind.textContent = `Step ${stepNum} of 3`;
    else if(ind) ind.textContent = 'Completed';
  }
}

function backToStep(stepNum) {
  if(stepNum === 2) {
    // Before going back to 2, reset time selection
    bookingState.date = '';
    bookingState.time = '';
    document.getElementById('smart-appt-date').value = '';
    document.getElementById('time-slots-container').style.display = 'none';
    document.getElementById('confirm-booking-btn').disabled = true;
  }
  switchStep(stepNum);
}

function proceedToStep2() {
  const domainEl = document.getElementById('smart-appt-domain');
  const cityEl = document.getElementById('smart-appt-city');
  if(!domainEl.value) {
    showToast('Please select a Specialization first.', 'warning');
    return;
  }
  bookingState.domain = domainEl.value;
  bookingState.city = cityEl.value;
  
  const docs = DOCTORS_DB.filter(d => d.spec === bookingState.domain && d.city === bookingState.city);
  const grid = document.getElementById('doctor-results-grid');
  
  if (docs.length === 0) {
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding: 32px; background:var(--bg-overlay); border-radius:var(--radius-md);">
      <div style="font-size:32px; margin-bottom:8px">🏥</div>
      <div style="font-weight:600; color:var(--text-primary);">No doctors found</div>
      <div style="font-size:13px; color:var(--text-secondary);">We currently do not have a ${bookingState.domain} available in ${bookingState.city}. Try another city.</div>
    </div>`;
  } else {
    grid.innerHTML = docs.map(d => `
      <div class="doctor-card" onclick="selectDoctor(${d.id})">
        <div class="doctor-avatar">👨‍⚕️</div>
        <div class="doctor-info">
          <div class="doctor-name">${d.name}</div>
          <div class="doctor-spec">${d.spec}</div>
          <div class="doctor-meta">
            <span class="rating">⭐ ${d.rating}</span>
            <span>⏱️ ${d.exp}</span>
          </div>
        </div>
      </div>
    `).join('');
  }
  switchStep(2);
}

function selectDoctor(id) {
  bookingState.doctorId = id;
  const doc = DOCTORS_DB.find(d => d.id === id);
  
  // Render Summary header
  document.getElementById('selected-doctor-summary').innerHTML = `
    <div style="font-size: 32px;">👨‍⚕️</div>
    <div>
      <div style="font-weight: 700; font-size: 16px;">Booking with ${doc.name}</div>
      <div style="font-size: 13px; color: var(--text-secondary);">${doc.spec} • ${doc.city}</div>
    </div>
  `;
  
  // Set min date to today
  const dateInput = document.getElementById('smart-appt-date');
  const today = new Date().toISOString().split('T')[0];
  dateInput.min = today;
  dateInput.value = ''; // Reset UI
  
  document.getElementById('time-slots-container').style.display = 'none';
  document.getElementById('confirm-booking-btn').disabled = true;
  
  switchStep(3);
}

function loadTimeSlots() {
  const dateVal = document.getElementById('smart-appt-date').value;
  if(!dateVal) return;
  bookingState.date = dateVal;
  bookingState.time = ''; // Reset chosen time
  document.getElementById('confirm-booking-btn').disabled = true;
  
  const container = document.getElementById('time-slots-container');
  const grid = document.getElementById('time-slots-grid');
  container.style.display = 'block';
  
  // Cross reference LocalStorage to see if slot is globally booked
  let bookedArray = [];
  try {
    bookedArray = JSON.parse(localStorage.getItem('medicare_booked_slots')) || [];
  } catch(e) {}
  
  // Generate pills
  grid.innerHTML = ALL_SLOTS.map(timeStr => {
    // Format: "docId_YYYY-MM-DD_HH:MM"
    const slotKey = `${bookingState.doctorId}_${bookingState.date}_${timeStr}`;
    const isBooked = bookedArray.includes(slotKey);
    
    // Check if slot is in the past for TODAY
    const today = new Date();
    const isToday = bookingState.date === today.toISOString().split('T')[0];
    const [h, m] = timeStr.split(':').map(Number);
    let isPast = false;
    if (isToday) {
      if(h < today.getHours() || (h === today.getHours() && m <= today.getMinutes())) {
         isPast = true;
      }
    }

    if (isBooked || isPast) {
      return `<div class="time-slot disabled">${formatApptTime(timeStr)}</div>`;
    } else {
      return `<div class="time-slot" onclick="selectTimeSlot(this, '${timeStr}')">${formatApptTime(timeStr)}</div>`;
    }
  }).join('');
}

function selectTimeSlot(el, timeStr) {
  // Clear previous selections
  document.querySelectorAll('.time-slot.selected').forEach(x => x.classList.remove('selected'));
  el.classList.add('selected');
  bookingState.time = timeStr;
  document.getElementById('confirm-booking-btn').disabled = false;
}

// ── BOOKING INTEGRATION ──

async function confirmBooking() {
  if(!bookingState.doctorId || !bookingState.date || !bookingState.time) {
    return showToast('Please select Doctor, Date and Time', 'error');
  }

  const btn = document.getElementById('confirm-booking-btn');
  btn.disabled = true;
  btn.innerHTML = 'Booking...';

  const doc = DOCTORS_DB.find(d => d.id === bookingState.doctorId);
  const locationMock = `${doc.city} Central Hospital, Level 2`;

  const payload = {
    doctor_name: doc.name,
    specialization: doc.spec,
    date: bookingState.date,
    time: bookingState.time,
    location: locationMock,
    notes: 'Booked via Smart Wizard'
  };

  try {
    // 1. Save to DB
    await apiFetch('/api/appointments', { method: 'POST', body: JSON.stringify(payload) });
    
    // 2. Register slot as disabled globally
    let bookedArray = JSON.parse(localStorage.getItem('medicare_booked_slots')) || [];
    bookedArray.push(`${doc.id}_${bookingState.date}_${bookingState.time}`);
    localStorage.setItem('medicare_booked_slots', JSON.stringify(bookedArray));
    
    // 3. Schedule T-30 Notification via SW
    scheduleAppointmentReminder(doc.name, bookingState.date, bookingState.time, locationMock);

    // 4. Update Success Screen
    document.getElementById('success-summary-text').innerHTML = `
      <strong>${doc.name}</strong><br>
      ${doc.spec} • ${doc.city}<br><br>
      📅 ${formatApptDate(bookingState.date)}<br>
      ⏰ ${formatApptTime(bookingState.time)}<br>
      📍 ${locationMock}
    `;
    switchStep(4);
    
    // 6. Reload Timeline
    await loadAppointments();

  } catch (err) {
    showToast(err.message, 'error');
    btn.disabled = false;
    btn.innerHTML = '📅 Confirm Booking';
  }
}

function resetBookingFlow() {
  bookingState = { domain: '', city: 'Ahmedabad', doctorId: null, date: '', time: '' };
  document.getElementById('smart-appt-domain').value = '';
  document.getElementById('smart-appt-city').value = 'Ahmedabad';
  document.getElementById('smart-appt-date').value = '';
  document.getElementById('time-slots-container').style.display = 'none';
  document.getElementById('confirm-booking-btn').disabled = true;
  
  // Revert UI to step 1
  switchStep(1);
}

// ── REMINDERS / SW ALARM LOGIC ──

function scheduleAppointmentReminder(docName, dateIso, timeIso, location) {
  // Goal: trigger exactly 30 mins before the appointment
  const current = new Date();
  const targetDate = new Date(`${dateIso}T${timeIso}:00`);
  
  // 30 min before
  targetDate.setMinutes(targetDate.getMinutes() - 30);
  
  if (targetDate <= current) {
    // Already past the 30-min warning window, don't schedule
    console.log("Too close to appointment to schedule a 30-min reminder.");
    return;
  }

  const delayMs = targetDate - current;
  
  // Also store the exact details to read back when the reminder fires natively
  localStorage.setItem('medicare_last_booked_appt', JSON.stringify({ docName, time: timeIso, location }));

  // Post to Service Worker to keep it alive
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SET_ALARM',
      id: 'appt_reminder',
      targetMs: targetDate.getTime()
    });
    console.log(`[Appt] Registered SW Alarm for ${formatApptTime(timeIso)} in ${Math.round(delayMs/60000)} mins`);
  } else {
    // Fallback if SW is dead
    setTimeout(() => { triggerApptReminder(docName, timeIso, location); }, delayMs);
  }
}

// Listening to the SW's return trigger (usually registered alongside water syncs in fitness.js)
if('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data && event.data.type === 'ALARM_TRIGGERED' && event.data.ids.includes('appt_reminder')) {
      const stored = JSON.parse(localStorage.getItem('medicare_last_booked_appt'));
      if(stored) triggerApptReminder(stored.docName, stored.time, stored.location);
    }
  });
}

function triggerApptReminder(docName, timeIso, loc) {
  const tStr = formatApptTime(timeIso);
  const msg = `Upcoming Appointment at ${tStr} with ${docName}`;
  const txt = `Location: ${loc}`;
  
  if(typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    new Notification(msg, { body: txt, icon: '📅' });
  }
  showToast(`Reminder: ${msg}`, 'info', 10000);
  if(typeof speak === 'function') speak(`Reminder. You have an appointment with ${docName} coming up at ${tStr}.`);
  
  // Play sound
  try { new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play(); } catch(e){}
}

// DEMO HELPER
window.triggerAppointmentReminderNow = function() {
  const stored = JSON.parse(localStorage.getItem('medicare_last_booked_appt'));
  if(stored) {
    triggerApptReminder(stored.docName, stored.time, stored.location);
  } else {
    // Fallback if they didn't book one locally yet
    triggerApptReminder("Dr. Sneha Sharma", "14:00", "Ahmedabad Central Hospital");
  }
};


// ── APPOINTMENT TIMELINE RENDERER (EXISTING LOGIC) ──

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
          <div class="timeline-meta-item"><span>⏰</span>${formatApptTime(a.time)}</div>
          ${a.location ? `<div class="timeline-meta-item"><span>📍</span>${escHtml(a.location)}</div>` : ''}
        </div>
        <div style="margin-top:12px">
          <button class="btn btn-danger btn-sm" onclick="deleteAppointment(${a.id})">🗑️ Cancel</button>
        </div>
      </div>
    </div>`;
  }).join('')}</div>`;
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

function formatApptTime(time) {
  if (!time) return '';
  const [h, m] = time.split(':');
  const d = new Date(); d.setHours(h); d.setMinutes(m);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function updateApptBadge(count) {
  const b = document.getElementById('appt-badge'); if (b) b.textContent = count;
}
