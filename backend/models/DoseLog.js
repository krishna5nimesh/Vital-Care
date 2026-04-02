const mongoose = require('mongoose');

const doseLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  medication: { type: mongoose.Schema.Types.ObjectId, ref: 'Medication', required: true },
  scheduledTime: { type: Date, required: true },
  status: { type: String, enum: ['taken', 'missed', 'pending'], default: 'pending' },
  takenAt: { type: Date },
  notified: { type: Boolean, default: false }
});

module.exports = mongoose.model('DoseLog', doseLogSchema);
