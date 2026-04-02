const cron = require('node-cron');
const Medication = require('../models/Medication');
const DoseLog = require('../models/DoseLog');
const moment = require('date-fns');

// Dummy function to simulate creating logs for today based on scheduled times
const createDailyLogs = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const timezoneOffset = new Date().getTimezoneOffset(); // just a simplified logic for now

    const medications = await Medication.find({});
    for (let med of medications) {
      if (med.times && med.times.length > 0) {
        for (let timeStr of med.times) {
          // timeStr is like "08:00"
          const [hours, minutes] = timeStr.split(':');
          const scheduledDate = new Date();
          scheduledDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

          // Check if log already exists for this exact time
          const existingLog = await DoseLog.findOne({
            medication: med._id,
            user: med.user,
            scheduledTime: scheduledDate
          });

          if (!existingLog) {
             await DoseLog.create({
                 user: med.user,
                 medication: med._id,
                 scheduledTime: scheduledDate,
                 status: 'pending'
             });
          }
        }
      }
    }
    console.log("Daily dose logs checking completed.");
  } catch (err) {
    console.error("Cron job error:", err);
  }
};

// Run cron job every hour to generate notifications/logs (simplified for demo)
// Normally would run at exactly midnight or every 5 mins.
cron.schedule('0 * * * *', createDailyLogs);

module.exports = createDailyLogs; // Export to allow initial call on startup
