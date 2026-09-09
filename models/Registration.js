const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema(
  {
    registrationId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    registrationNumber: {
      type: String,
      trim: true,
      uppercase: true
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^[a-zA-Z0-9._%+-]+@klu\.ac\.in$/i, 'Email must be an official university email ending with @klu.ac.in']
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^[0-9]{10}$/, 'Phone number must be a 10-digit number']
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true
    },
    year: {
      type: String,
      required: [true, 'Year of study is required'],
      trim: true
    },
    paymentRef: {
      type: String,
      required: [true, 'Payment UTR / reference is required'],
      trim: true
    },
    paymentScreenshot: {
      type: String,
      required: [true, 'Payment screenshot is required']
    },
    fee: {
      type: Number,
      default: 100
    },
    status: {
      type: String,
      enum: ['confirmed', 'verified', 'attended', 'cancelled'],
      default: 'confirmed'
    },
    attendedAt: {
      type: Date
    },
    attendedBy: {
      type: String,
      default: 'Gate Scanner'
    }
  },
  {
    timestamps: true
  }
);

registrationSchema.index({ email: 1, phone: 1 });

module.exports = mongoose.model('Registration', registrationSchema);
