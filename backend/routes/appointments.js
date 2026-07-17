const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const { protect } = require('../middleware/auth');

// Get all appointments for user
router.get('/', protect, async (req, res) => {
  try {
    const appointments = await Appointment.find({ user: req.user._id }).sort({ scheduledDate: 1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new appointment
router.post('/', protect, async (req, res) => {
  try {
    const { title, type, date, time } = req.body;
    
    // Parse date and time into a single Date object
    const [hours, minutes] = time.split(':');
    const scheduledDate = new Date(date);
    scheduledDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

    const appointment = new Appointment({
      user: req.user._id,
      title,
      type,
      scheduledDate,
      notified: false
    });
    
    const created = await appointment.save();
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete appointment
router.delete('/:id', protect, async (req, res) => {
   try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Not found' });
    if (appointment.user.toString() !== req.user._id.toString()) return res.status(401).json({ message: 'Not authorized' });
    
    await appointment.deleteOne();
    res.json({ message: 'Appointment removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark appointment as notified
router.put('/:id/notify', protect, async (req, res) => {
  try {
      const appointment = await Appointment.findById(req.params.id);
      if (!appointment) return res.status(404).json({ message: 'Not found' });
      
      appointment.notified = true;
      await appointment.save();
      res.json({ message: 'Marked as notified' });
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
});

module.exports = router;
