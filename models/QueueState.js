const mongoose = require('mongoose');

const queueStateSchema = new mongoose.Schema({
  hospital: { type: String, required: true },
  department: { type: String, required: true },
  lastIssuedTokenNumber: { type: Number, default: 0 },
  currentServingTokenNumber: { type: Number, default: 0 },
  activeWaitersCount: { type: Number, default: 0 },
  averageServiceTimeMs: { type: Number, default: 480000 }, // default 8 minutes
}, { timestamps: true });

// Ensure one state document per hospital + department combination
queueStateSchema.index({ hospital: 1, department: 1 }, { unique: true });

module.exports = mongoose.model('QueueState', queueStateSchema);
