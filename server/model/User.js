const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  photo: {
    type: String,
    default: 'https://via.placeholder.com/150'
  },
  address: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  designation: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    enum: ['Faculty', 'Student Volunteers', 'Student Council', 'Advisor', 'Mentor', 'Other'],
    default: 'Other'
  },
  extra: {
    linkedin: {
      type: String,
      default: ''
    },
    github: {
      type: String,
      default: ''
    }
  },
  refreshToken: {
    type: String,
    select: false // Don't include refresh token in queries by default
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  // Determines display order (e.g. on the /team page). Lower rank is shown first.
  // Auto-assigned in creation order when not explicitly set, so users added earlier
  // keep coming first unless an admin manually re-ranks them.
  rank: {
    type: Number,
    default: null
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Auto-assign rank based on creation order when not explicitly provided
userSchema.pre('save', async function(next) {
  if (this.isNew && (this.rank === undefined || this.rank === null)) {
    const count = await this.constructor.countDocuments();
    this.rank = count + 1;
  }
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate refresh token
userSchema.methods.generateRefreshToken = function() {
  const crypto = require('crypto');
  const refreshToken = crypto.randomBytes(32).toString('hex');
  this.refreshToken = refreshToken;
  return refreshToken;
};

module.exports = mongoose.model('User', userSchema);
