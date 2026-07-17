const express = require('express');
const router = express.Router();
const { CohereClient } = require('cohere-ai');
const Medication = require('../models/Medication');
const { protect } = require('../middleware/auth');

// Per-user cooldown map
const userCooldowns = new Map();
const COOLDOWN_MS = 5000; // longer cooldown for medical generation

const MODEL_FALLBACK = ['command-r-plus-08-2024', 'command-r-08-2024', 'command-r', 'command'];

async function analyzeSymptoms(systemPrompt, userMessage) {
  if (!process.env.COHERE_API_KEY) throw new Error('NO_KEY');
  const cohere = new CohereClient({ token: process.env.COHERE_API_KEY });
  for (const model of MODEL_FALLBACK) {
    try {
      console.log(`[AI-Symptoms] Trying ${model}`);
      const response = await cohere.chat({
        model,
        preamble: systemPrompt,
        message: userMessage,
        temperature: 0.3,
        maxTokens: 500,
      });
      return response.text?.trim();
    } catch (err) {
      const status = err.status || err.statusCode || 0;
      if (status === 401) throw new Error('INVALID_API_KEY');
      continue;
    }
  }
  throw new Error('QUOTA_EXCEEDED');
}

router.post('/analyze', protect, async (req, res) => {
  try {
    const { symptoms } = req.body;
    if (!process.env.COHERE_API_KEY) return res.json({ reply: 'API configuration missing.' });

    const userId = req.user._id.toString();
    const lastRequest = userCooldowns.get(userId) || 0;
    const now = Date.now();
    if (now - lastRequest < COOLDOWN_MS) {
      return res.json({ reply: `Please wait a few seconds before another analysis.` });
    }
    userCooldowns.set(userId, now);

    const medications = await Medication.find({ user: req.user._id });
    const medSummary = medications.map(m => `${m.name}`).join(', ') || 'none';

    const systemPrompt = `You are Vital Care's Medical Symptom Analyzer AI. The user will provide a list of symptoms they are experiencing.
Your current user is taking these medications: ${medSummary}.

Analyze the symptoms and provide:
1. Potential broad causes (e.g. viral infection, fatigue). 
2. Home remedies or immediate lifestyle suggestions.
3. Relevant interactions if they might relate to their current medications.

IMPORTANT MEDICAL DISCLAIMER: Start your response with "⚠️ Disclaimer: This is an AI analysis, not medical advice. Please consult a doctor for severe symptoms."
Keep your overall response clear, structured with bullet points, and highly objective.`;

    try {
      const text = await analyzeSymptoms(systemPrompt, symptoms);
      res.json({ reply: text });
    } catch (apiError) {
      console.error(apiError);
      res.json({ reply: 'Symptom analysis is currently unavailable. Please check your API key.' });
    }

  } catch (error) {
    res.status(500).json({ reply: 'Server error during analysis' });
  }
});

module.exports = router;
