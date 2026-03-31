const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hospital: { type: String, required: true },
  department: { type: String, required: true },
  tokenNumber: { type: Number, required: true },
  patientName: { type: String, required: true },
  phone: { type: String, required: true, minlength: 10, maxlength: 10 },
  status: {
    type: String,
    enum: ['waiting', 'serving', 'completed', 'skipped', 'cancelled'],
    default: 'waiting'
  },
  estimatedWait: { type: Number, default: 0 },
  priority: { type: Boolean, default: false },
  lifecycleEvents: [
    {
      state: { type: String, enum: ['waiting', 'serving', 'completed', 'skipped', 'cancelled'] },
      timestamp: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

// Ensure strict uniqueness: a user cannot have multiple active tokens
tokenSchema.index(
  { user: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['waiting', 'serving'] } }
  }
);
// Quick lookup for a single department queue
tokenSchema.index({ hospital: 1, department: 1, status: 1, tokenNumber: 1 });

module.exports = mongoose.model('Token', tokenSchema);
