const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Registration = require('../models/Registration');

// Generate unique registration ID: BS-XXXXXX
async function generateUniqueRegistrationId() {
  let unique = false;
  let regId = '';
  while (!unique) {
    const random = Math.floor(100000 + Math.random() * 900000);
    regId = `BS-${random}`;
    const existing = await Registration.findOne({ registrationId: regId });
    if (!existing) {
      unique = true;
    }
  }
  return regId;
}

// @route   POST /api/register
// @desc    Create a new participant registration
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, phone, college, department, year, slot, paymentRef } = req.body;

    if (!fullName || !email || !phone || !college || !department || !year || !slot || !paymentRef) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required. Please fill in every detail.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();
    const cleanPaymentRef = paymentRef.trim();

    // Check duplicate payment reference
    const existingPayment = await Registration.findOne({ paymentRef: { $regex: new RegExp(`^${cleanPaymentRef}$`, 'i') } });
    if (existingPayment) {
      return res.status(409).json({
        success: false,
        message: 'This Payment UTR / Reference ID has already been registered.',
        existingId: existingPayment.registrationId
      });
    }

    // Check duplicate email
    const existingEmail = await Registration.findOne({ email: cleanEmail });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: `An entry with email "${cleanEmail}" is already registered (${existingEmail.registrationId}).`,
        existingId: existingEmail.registrationId
      });
    }

    const registrationId = await generateUniqueRegistrationId();

    const newRegistration = new Registration({
      registrationId,
      fullName: fullName.trim(),
      email: cleanEmail,
      phone: cleanPhone,
      college: college.trim(),
      department: department.trim(),
      year: year.trim(),
      slot: slot.trim(),
      paymentRef: cleanPaymentRef,
      fee: 100,
      status: 'confirmed'
    });

    const savedDoc = await newRegistration.save();

    return res.status(201).json({
      success: true,
      message: 'Registration successfully submitted and recorded!',
      registration: savedDoc
    });
  } catch (error) {
    console.error('Registration Error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Server error while processing registration. Please try again later.'
    });
  }
});

// @route   POST /api/attendance/verify-pin
// @desc    Verify security passcode for gate attendance portal access
router.post('/attendance/verify-pin', (req, res) => {
  const { pin } = req.body;
  const configuredPin = process.env.ATTENDANCE_PIN || '090307';

  if (!pin || pin.trim() !== configuredPin.trim()) {
    return res.status(401).json({
      success: false,
      message: 'Incorrect security code. Access denied.'
    });
  }

  return res.json({
    success: true,
    message: 'Access granted to Gate Attendance Portal.'
  });
});

// @route   POST /api/attendance/scan
// @desc    Scan QR/Barcode and mark participant attendance
router.post('/attendance/scan', async (req, res) => {
  try {
    let { id } = req.body;
    if (!id || !id.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide a valid ticket code or registration ID.' });
    }

    // Clean input (in case URL or prefix was scanned)
    let searchId = id.trim();
    if (searchId.includes('id=')) {
      const match = searchId.match(/id=([^&]+)/);
      if (match) searchId = match[1];
    } else if (searchId.includes('/')) {
      const parts = searchId.split('/');
      searchId = parts[parts.length - 1];
    }

    const registration = await Registration.findOne({
      $or: [
        { registrationId: { $regex: `^${searchId}$`, $options: 'i' } },
        { email: { $regex: `^${searchId}$`, $options: 'i' } },
        { phone: searchId }
      ]
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        type: 'INVALID',
        message: `Ticket "${searchId}" NOT FOUND in database! Please check registration details.`
      });
    }

    // Check if ALREADY ATTENDED
    if (registration.status === 'attended') {
      const attendedTimeString = registration.attendedAt
        ? new Date(registration.attendedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        : 'Earlier';

      return res.status(409).json({
        success: false,
        type: 'ALREADY_ATTENDED',
        message: `⚠️ ALREADY CHECKED IN at ${attendedTimeString}!`,
        participant: registration,
        attendedAt: registration.attendedAt
      });
    }

    // Mark as ATTENDED
    registration.status = 'attended';
    registration.attendedAt = new Date();
    registration.attendedBy = req.body.operator || 'Gate 9312 Scanner';
    await registration.save();

    return res.status(200).json({
      success: true,
      type: 'SUCCESS',
      message: '✓ Attendance Marked Successfully! Entry Granted.',
      participant: registration,
      attendedAt: registration.attendedAt
    });

  } catch (error) {
    console.error('Attendance Scan Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while verifying attendance.'
    });
  }
});

// @route   GET /api/attendance/recent
// @desc    Get recent live check-ins for the scanner feed
router.get('/attendance/recent', async (req, res) => {
  try {
    const recent = await Registration.find({ status: 'attended' })
      .sort({ attendedAt: -1 })
      .limit(10);

    return res.json({
      success: true,
      recent
    });
  } catch (error) {
    console.error('Recent Attendance Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch recent attendance.' });
  }
});

// @route   GET /api/registrations
// @desc    Get all registrations with search, filter, and pagination support
router.get('/registrations', async (req, res) => {
  try {
    const { search, slot, year, status, sort = 'desc' } = req.query;
    let query = {};

    if (slot && slot !== 'all') {
      query.slot = { $regex: slot, $options: 'i' };
    }

    if (year && year !== 'all') {
      query.year = year;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search && search.trim()) {
      const s = search.trim();
      query.$or = [
        { registrationId: { $regex: s, $options: 'i' } },
        { fullName: { $regex: s, $options: 'i' } },
        { email: { $regex: s, $options: 'i' } },
        { phone: { $regex: s, $options: 'i' } },
        { college: { $regex: s, $options: 'i' } },
        { department: { $regex: s, $options: 'i' } },
        { paymentRef: { $regex: s, $options: 'i' } }
      ];
    }

    const sortOrder = sort === 'asc' ? 1 : -1;
    const registrations = await Registration.find(query).sort({ createdAt: sortOrder });

    return res.json({
      success: true,
      count: registrations.length,
      registrations
    });
  } catch (error) {
    console.error('Fetch Registrations Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch registrations.'
    });
  }
});

// @route   GET /api/registration/:id
// @desc    Lookup registration by registrationId, email, or phone
router.get('/registration/:id', async (req, res) => {
  try {
    const term = req.params.id.trim();

    const registration = await Registration.findOne({
      $or: [
        { registrationId: { $regex: `^${term}$`, $options: 'i' } },
        { email: { $regex: `^${term}$`, $options: 'i' } },
        { phone: term }
      ]
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: `No registration found matching "${term}". Please check your details.`
      });
    }

    return res.json({
      success: true,
      registration
    });
  } catch (error) {
    console.error('Lookup Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error searching for registration.'
    });
  }
});

// @route   GET /api/stats
// @desc    Get event stats summary (counts, slots, revenue, attended)
router.get('/stats', async (req, res) => {
  try {
    const total = await Registration.countDocuments();
    const slot1 = await Registration.countDocuments({ slot: { $regex: 'Slot 1', $options: 'i' } });
    const slot2 = await Registration.countDocuments({ slot: { $regex: 'Slot 2', $options: 'i' } });
    const attended = await Registration.countDocuments({ status: 'attended' });
    const slot1Attended = await Registration.countDocuments({ slot: { $regex: 'Slot 1', $options: 'i' }, status: 'attended' });
    const slot2Attended = await Registration.countDocuments({ slot: { $regex: 'Slot 2', $options: 'i' }, status: 'attended' });

    return res.json({
      success: true,
      stats: {
        total,
        slot1,
        slot2,
        attended,
        slot1Attended,
        slot2Attended,
        attendancePercentage: total > 0 ? Math.round((attended / total) * 100) : 0,
        totalRevenue: total * 100,
        currency: '₹'
      }
    });
  } catch (error) {
    console.error('Stats Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve stats.'
    });
  }
});

// @route   GET /api/export
// @desc    Export all registrations as CSV
router.get('/export', async (req, res) => {
  try {
    const registrations = await Registration.find().sort({ createdAt: -1 });

    const headers = [
      'Registration ID',
      'Full Name',
      'Email',
      'Phone',
      'College',
      'Department',
      'Year',
      'Slot',
      'Payment Reference',
      'Fee (INR)',
      'Status',
      'Attended At',
      'Registration Date'
    ];

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = registrations.map(r => [
      escapeCsv(r.registrationId),
      escapeCsv(r.fullName),
      escapeCsv(r.email),
      escapeCsv(r.phone),
      escapeCsv(r.college),
      escapeCsv(r.department),
      escapeCsv(r.year),
      escapeCsv(r.slot),
      escapeCsv(r.paymentRef),
      escapeCsv(r.fee),
      escapeCsv(r.status),
      escapeCsv(r.attendedAt ? new Date(r.attendedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'Not Attended'),
      escapeCsv(new Date(r.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }))
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="brainstorm_registrations_' + Date.now() + '.csv"');
    return res.send(csvContent);
  } catch (error) {
    console.error('Export Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to export registrations CSV.'
    });
  }
});

// @route   PATCH /api/registration/:id/status
// @desc    Update status of registration (e.g. mark verified/attended)
router.patch('/registration/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['confirmed', 'verified', 'attended', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const updateData = { status };
    if (status === 'attended') {
      updateData.attendedAt = new Date();
    }

    const updated = await Registration.findOneAndUpdate(
      { registrationId: req.params.id.toUpperCase() },
      updateData,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    return res.json({ success: true, message: 'Status updated', registration: updated });
  } catch (error) {
    console.error('Status Update Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update status' });
  }
});

// @route   DELETE /api/registration/:id
// @desc    Delete a registration
router.delete('/registration/:id', async (req, res) => {
  try {
    const deleted = await Registration.findOneAndDelete({
      registrationId: req.params.id.toUpperCase()
    });

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    return res.json({ success: true, message: 'Registration deleted successfully' });
  } catch (error) {
    console.error('Delete Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete registration' });
  }
});

// @route   GET /api/health
// @desc    Health check and database status
router.get('/health', (req, res) => {
  const dbStatusMap = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting'
  };

  const state = mongoose.connection.readyState;
  const isOk = state === 1;

  res.status(isOk ? 200 : 503).json({
    status: isOk ? 'healthy' : 'degraded',
    database: {
      status: dbStatusMap[state] || 'Unknown',
      connected: isOk,
      host: mongoose.connection.host || 'MongoDB Atlas'
    },
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
