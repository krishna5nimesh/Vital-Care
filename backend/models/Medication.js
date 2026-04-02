const mongoose = require('mongoose');

const medicationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  dosage: { type: String, required: true }, // e.g., '1 pill', '5ml'
  frequency: { type: String, required: true }, // e.g., 'daily', 'twice a day'
  times: [{ type: String }], // Array of time strings like '08:00', '20:00'
  color: { type: String, default: '#ff00aa' }, // Magical color for UI
  createdAt: { type: Date, default: Date.now },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date }
});

module.exports = mongoose.model('Medication', medicationSchema);
