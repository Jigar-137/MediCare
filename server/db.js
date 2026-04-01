// db.js — Lightweight JSON File Store (no native dependencies)
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/db.json');

// Ensure data directory exists
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

// Initialize DB structure
function loadDB() {
  if (!fs.existsSync(DB_PATH)) {
    const initial = { users: [], profile: [], medicines: [], appointments: [], _counters: { users: 0, profile: 0, medicines: 0, appointments: 0 } };
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
    return initial;
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function saveDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// Database API — mimics SQLite prepare/get/all/run
const db = {
  // ── Users ──
  users: {
    findByEmail: (email) => { const d = loadDB(); return d.users.find(u => u.email === email) || null; },
    findById: (id) => { const d = loadDB(); return d.users.find(u => u.id === id) || null; },
    create: (name, email, password) => {
      const d = loadDB();
      const id = ++d._counters.users;
      const user = { id, name, email, password, created_at: new Date().toISOString() };
      d.users.push(user);
      saveDB(d);
      return user;
    }
  },
  // ── Profile ──
  profile: {
    findByUserId: (uid) => { const d = loadDB(); return d.profile.find(p => p.user_id === uid) || null; },
    create: (uid) => {
      const d = loadDB();
      const id = ++d._counters.profile;
      const p = { id, user_id: uid, dob: null, gender: null, blood_group: null, height: null, weight: null, allergies: null, emergency_contact: null };
      d.profile.push(p);
      saveDB(d);
      return p;
    },
    update: (uid, fields) => {
      const d = loadDB();
      const idx = d.profile.findIndex(p => p.user_id === uid);
      if (idx === -1) return;
      d.profile[idx] = { ...d.profile[idx], ...fields };
      saveDB(d);
    }
  },
  // ── Users update name ──
  updateUserName: (id, name) => {
    const d = loadDB();
    const idx = d.users.findIndex(u => u.id === id);
    if (idx !== -1) { d.users[idx].name = name; saveDB(d); }
  },
  // ── Medicines ──
  medicines: {
    getAllByUser: (uid) => { const d = loadDB(); return d.medicines.filter(m => m.user_id === uid).sort((a,b) => a.time.localeCompare(b.time)); },
    findById: (id, uid) => { const d = loadDB(); return d.medicines.find(m => m.id === id && m.user_id === uid) || null; },
    create: (uid, name, dosage, time, frequency, notes) => {
      const d = loadDB();
      const id = ++d._counters.medicines;
      const m = { id, user_id: uid, name, dosage, time, frequency: frequency || 'daily', notes: notes || '', created_at: new Date().toISOString() };
      d.medicines.push(m);
      saveDB(d);
      return m;
    },
    delete: (id) => {
      const d = loadDB();
      d.medicines = d.medicines.filter(m => m.id !== id);
      saveDB(d);
    }
  },
  // ── Appointments ──
  appointments: {
    getAllByUser: (uid) => {
      const d = loadDB();
      return d.appointments.filter(a => a.user_id === uid).sort((a,b) => (a.date+a.time).localeCompare(b.date+b.time));
    },
    findById: (id, uid) => { const d = loadDB(); return d.appointments.find(a => a.id === id && a.user_id === uid) || null; },
    create: (uid, doctor_name, specialization, date, time, location, notes) => {
      const d = loadDB();
      const id = ++d._counters.appointments;
      const a = { id, user_id: uid, doctor_name, specialization: specialization || '', date, time, location: location || '', notes: notes || '', status: 'upcoming', created_at: new Date().toISOString() };
      d.appointments.push(a);
      saveDB(d);
      return a;
    },
    delete: (id) => {
      const d = loadDB();
      d.appointments = d.appointments.filter(a => a.id !== id);
      saveDB(d);
    }
  }
};

module.exports = db;
