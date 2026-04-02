const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Get all medicines for user
router.get('/', (req, res) => {
  const medicines = db.medicines.getAllByUser(req.user.id);
  res.json(medicines);
});

// Add medicine
router.post('/', (req, res) => {
  const { name, dosage, time, frequency, notes } = req.body;
  if (!name || !dosage || !time)
    return res.status(400).json({ error: 'Name, dosage and time are required' });

  const med = db.medicines.create(req.user.id, name, dosage, time, frequency, notes);
  res.status(201).json(med);
});

// Delete medicine
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
  const medicine = db.medicines.findById(id, req.user.id);
  if (!medicine) return res.status(404).json({ error: 'Medicine not found' });

  db.medicines.delete(id);
  res.json({ success: true });
});

module.exports = router;
