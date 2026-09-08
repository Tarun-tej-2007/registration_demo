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
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^[0-9]{10}$/, 'Phone number must be a 10-digit number']
    },
    college: {
      type: String,
      required: [true, 'College name is required'],
      trim: true
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
    slot: {
      type: String,
      required: [true, 'Slot selection is required'],
      trim: true
    },
    paymentRef: {
      type: String,
      required: [true, 'Payment UTR / reference is required'],
      trim: true
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
