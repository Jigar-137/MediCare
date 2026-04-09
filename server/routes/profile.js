const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Get profile
router.get('/', (req, res) => {
  const user = db.users.findById(req.user.id);
  const profile = db.profile.findByUserId(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  // Remove password from response
  const { password, ...safeUser } = user;
  res.json({ ...safeUser, ...(profile || {}) });
});

// Update profile
router.put('/', (req, res) => {
  const { name, dob, gender, blood_group, height, weight, allergies, emergency_contact, profile_picture } = req.body;

  if (name) db.updateUserName(req.user.id, name);

  db.profile.update(req.user.id, {
    dob: dob || null,
    gender: gender || null,
    blood_group: blood_group || null,
    height: height || null,
    weight: weight || null,
    allergies: allergies || null,
    emergency_contact: emergency_contact || null,
    profile_picture: profile_picture || undefined
  });

  res.json({ success: true });
});

module.exports = router;
