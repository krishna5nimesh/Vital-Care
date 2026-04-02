const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Medication = require('../models/Medication');
const DoseLog = require('../models/DoseLog');
const { protect } = require('../middleware/auth');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/chat', protect, async (req, res) => {
  try {
    const { message } = req.body;
    
    // Fetch user context
    const medications = await Medication.find({ user: req.user._id });
    const logs = await DoseLog.find({ user: req.user._id }).sort({ scheduledTime: -1 }).limit(20).populate('medication');
    
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_key_here') {
      return res.json({ reply: `[Mock AI]: I see you are tracking ${medications.length} medications. To use the real AI Assistant, please provide a valid GEMINI_API_KEY in the backend/.env file.` });
    }

    // Construct context for AI
    const context = `
      You are an AI Health Assistant that helps users track their medication schedule and adherence.
      Current medications: ${JSON.stringify(medications)}
      Recent dose logs: ${JSON.stringify(logs)}
      User's question: "${message}"
      Reply in an encouraging, practical, and helpful tone. Keep it concise.
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const result = await model.generateContent(context);
    const response = await result.response;
    const text = response.text();
    
    res.json({ reply: text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ reply: "I am currently unable to analyze your data. Please try again later." });
  }
});

module.exports = router;
