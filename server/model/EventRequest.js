const mongoose = require('mongoose');

const ParticipantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const EventRequestSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['single', 'team'],
      required: true,
    },
    teamName: {
      type: String,
      default: '',
      trim: true,
    },
    participants: {
      type: [ParticipantSchema],
      validate: {
        validator: function (value) {
          return Array.isArray(value) && value.length > 0;
        },
        message: 'At least one participant is required',
      },
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

EventRequestSchema.index({ eventId: 1, status: 1 });

module.exports = mongoose.model('EventRequest', EventRequestSchema);