require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Serve static frontend files
app.use(express.static(path.join(__dirname)));

// API Routes
app.use('/api', apiRoutes);

// Fallback route for SPA / direct HTML file access
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/status', (req, res) => {
  res.sendFile(path.join(__dirname, 'status.html'));
});

app.get('/attendance', (req, res) => {
  res.sendFile(path.join(__dirname, 'attendance.html'));
});

// Database Connection
if (!MONGODB_URI) {
  console.error('CRITICAL: MONGODB_URI is not defined in your .env file.');
  process.exit(1);
}

console.log('Connecting to MongoDB Atlas...');

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log(' Successfully connected to MongoDB Atlas database: brainstorm_registrations');
    
    // Start listening on port
    app.listen(PORT, () => {
      console.log(`===================================================`);
      console.log(`🚀 BRAINSTORM Server running at http://localhost:${PORT}`);
      console.log(`🌐 Landing & Registration: http://localhost:${PORT}`);
      console.log(`🔍 Ticket & Status Portal: http://localhost:${PORT}/status.html`);
      console.log(`📊 Admin Dashboard:       http://localhost:${PORT}/admin.html`);
      console.log(`💓 Health & DB Status:    http://localhost:${PORT}/api/health`);
      console.log(`===================================================`);
    });
  })
  .catch((err) => {
    console.error(' MongoDB Connection Error:', err.message);
    console.error('Please ensure your IP address is whitelisted in MongoDB Atlas Network Access.');
  });

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected.');
});

mongoose.connection.on('reconnected', () => {
  console.log(' MongoDB reconnected.');
});

module.exports = app;
