const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Get all appointments
router.get('/', (req, res) => {
  const appointments = db.appointments.getAllByUser(req.user.id);
  res.json(appointments);
});

// Book appointment
router.post('/', (req, res) => {
  const { doctor_name, specialization, date, time, location, notes } = req.body;
  if (!doctor_name || !date || !time)
    return res.status(400).json({ error: 'Doctor name, date and time are required' });

  const appt = db.appointments.create(req.user.id, doctor_name, specialization, date, time, location, notes);
  res.status(201).json(appt);
});

// Delete appointment
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
  const appt = db.appointments.findById(id, req.user.id);
  if (!appt) return res.status(404).json({ error: 'Appointment not found' });

  db.appointments.delete(id);
  res.json({ success: true });
});

module.exports = router;
