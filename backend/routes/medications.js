const express = require('express');
const router = express.Router();
const Medication = require('../models/Medication');
const DoseLog = require('../models/DoseLog');
const { protect } = require('../middleware/auth');
const moment = require('date-fns');

// Get all medications for user
router.get('/', protect, async (req, res) => {
  try {
    const medications = await Medication.find({ user: req.user._id });
    res.json(medications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new medication schedule
router.post('/', protect, async (req, res) => {
  try {
    const { name, dosage, frequency, times, color } = req.body;
    const medication = new Medication({
      user: req.user._id, name, dosage, frequency, times, color
    });
    const created = await medication.save();

    // Automatically create DoseLogs for today based on the times provided
    if (times && times.length > 0) {
      for (let timeStr of times) {
        const [hours, minutes] = timeStr.split(':');
        const scheduledDate = new Date();
        scheduledDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
        
        await DoseLog.create({
          user: req.user._id,
          medication: created._id,
          scheduledTime: scheduledDate,
          status: 'pending'
        });
      }
    }

    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update medication
router.put('/:id', protect, async (req, res) => {
  try {
    const medication = await Medication.findById(req.params.id);
    if (!medication) return res.status(404).json({ message: 'Not found' });
    if (medication.user.toString() !== req.user._id.toString()) return res.status(401).json({ message: 'Not authorized' });
    
    const updated = await Medication.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete medication
router.delete('/:id', protect, async (req, res) => {
   try {
    const medication = await Medication.findById(req.params.id);
    if (!medication) return res.status(404).json({ message: 'Not found' });
    if (medication.user.toString() !== req.user._id.toString()) return res.status(401).json({ message: 'Not authorized' });
    
    await medication.deleteOne();
    await DoseLog.deleteMany({ medication: req.params.id }); 
    res.json({ message: 'Medication removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get dose logs for dashboard
router.get('/logs', protect, async (req, res) => {
    try {
        const logs = await DoseLog.find({ user: req.user._id }).populate('medication', 'name color');
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update dose log status (taken/missed)
router.put('/logs/:id', protect, async (req, res) => {
    try {
        const log = await DoseLog.findById(req.params.id);
        if (!log) return res.status(404).json({ message: 'Log not found' });
        if (log.user.toString() !== req.user._id.toString()) return res.status(401).json({ message: 'Not authorized' });

        log.status = req.body.status; // 'taken' or 'missed'
        if(req.body.status === 'taken') log.takenAt = Date.now();
        await log.save();
        res.json(log);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Mark log as notified
router.put('/logs/:id/notify', protect, async (req, res) => {
    try {
        const log = await DoseLog.findById(req.params.id);
        if (!log) return res.status(404).json({ message: 'Log not found' });
        
        log.notified = true;
        await log.save();
        res.json({ message: 'Marked as notified' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
