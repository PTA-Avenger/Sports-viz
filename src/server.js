// src/server.js

require('dotenv').config(); // ✅ Add dotenv at the top

const express = require('express');
const path = require('path');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json()); // Optional if you want to parse JSON

// Static files
const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

// API routes
app.use('/api', apiRoutes);

// Fallback for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
