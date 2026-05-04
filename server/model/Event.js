const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    details: {
      type: String,
      default: '',
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    photo: {
      type: String,
      default: 'https://via.placeholder.com/400x300',
    },
    location: {
      type: String,
      default: 'Online',
    },
    category: {
      type: String,
      enum: ['workshop', 'seminar', 'conference', 'webinar', 'hackathon', 'competition', 'other'],
      default: 'other',
    },
    registrationRequired: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    participationType: {
      type: String,
      enum: ['single', 'team'],
      default: 'single',
    },
    maxTeamSize: {
      type: Number,
      default: null,
      min: 1,
    },
    requiredParticipantFields: {
      type: [
        new mongoose.Schema(
          {
            fieldName: { type: String, required: true, trim: true },
            label: { type: String, required: true, trim: true },
            type: { type: String, default: 'text' },
            required: { type: Boolean, default: true },
          },
          { _id: false }
        ),
      ],
      default: [
        { fieldName: 'name', label: 'Name', type: 'text', required: true },
        { fieldName: 'email', label: 'Email', type: 'email', required: true },
        { fieldName: 'phone', label: 'Phone', type: 'text', required: true },
      ],
    },
    rules: {
      type: String,
      default: '',
    },
    maxParticipants: {
      type: Number,
      default: null,
      min: 1,
    },
    registrationDeadline: {
      type: Date,
      default: null,
    },
    contactEmail: {
      type: String,
      default: null,
    },
    contactPhone: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'closed'],
      default: 'draft',
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Event', EventSchema);