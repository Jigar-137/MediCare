require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const publicPath = path.join(__dirname, '../public');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(publicPath));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/medicines', require('./routes/medicines'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/symptoms', require('./routes/symptoms'));

// Health check
app.get('/health', (req, res) => res.send('OK'));

// SPA fallback (IMPORTANT FIX)
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(publicPath, 'index.html'));
  }
});

app.listen(PORT, () => {
  console.log(`🏥 MediCare running on port ${PORT}`);
});