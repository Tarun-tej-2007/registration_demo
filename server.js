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

// MongoDB Connection helper (compatible with standalone and serverless Vercel)
async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  if (!MONGODB_URI) {
    console.warn('⚠️ MONGODB_URI is not defined in environment variables.');
    return;
  }
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas database: brainstorm_registrations');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
  }
}

// Ensure DB connected before processing API requests
app.use('/api', async (req, res, next) => {
  await connectDB();
  next();
});

// API Routes
app.use('/api', apiRoutes);

// Serve static frontend files (for standalone local server)
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname)));

// Route mappings for friendly URLs
app.get('/', (req, res) => {
  const filePath = path.join(__dirname, 'public', 'index.html');
  res.sendFile(filePath);
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/status', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'status.html'));
});

app.get('/attendance', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'attendance.html'));
});

// Only listen on port if running directly (standalone Node.js environment)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`===================================================`);
      console.log(`🚀 BRAINSTORM Server running at http://localhost:${PORT}`);
      console.log(`🌐 Landing & Registration: http://localhost:${PORT}`);
      console.log(`🔍 Ticket & Status Portal: http://localhost:${PORT}/status.html`);
      console.log(`📊 Admin Dashboard:       http://localhost:${PORT}/admin.html`);
      console.log(`📷 Attendance Scanner:    http://localhost:${PORT}/attendance.html`);
      console.log(`💓 Health & DB Status:    http://localhost:${PORT}/api/health`);
      console.log(`===================================================`);
    });
  });
}

module.exports = app;
