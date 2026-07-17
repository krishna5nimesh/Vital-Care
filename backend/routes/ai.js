const express = require('express');
const router = express.Router();
const { CohereClient } = require('cohere-ai');
const Medication = require('../models/Medication');
const DoseLog = require('../models/DoseLog');
const { protect } = require('../middleware/auth');

// Per-user cooldown map
const userCooldowns = new Map();
const COOLDOWN_MS = 2000;

// Cohere models to try in order (all available on free trial key)
const MODEL_FALLBACK = [
  'command-r-plus-08-2024', // most capable
  'command-r-08-2024',      // fast + smart
  'command-r',              // reliable fallback
  'command',                // basic fallback
];

async function generateWithCohere(systemPrompt, userMessage) {
  if (!process.env.COHERE_API_KEY) {
    throw new Error('NO_KEY');
  }

  const cohere = new CohereClient({ token: process.env.COHERE_API_KEY });

  for (const model of MODEL_FALLBACK) {
    try {
      console.log(`[AI] Trying Cohere model: ${model}`);

      const response = await cohere.chat({
        model,
        preamble: systemPrompt,
        message: userMessage,
        temperature: 0.7,
        maxTokens: 400,
      });

      const text = response.text?.trim();
      console.log(`[AI] ✅ Success with: ${model}`);
      return text;
    } catch (err) {
      const status = err.status || err.statusCode || 0;
      const errMsg = err.message || '';

      console.error(`[AI] Error on ${model}: ${status} - ${errMsg}`);

      // Invalid API key
      if (status === 401 || errMsg.includes('invalid') || errMsg.includes('unauthorized')) {
        throw new Error('INVALID_API_KEY');
      }

      // Rate limit — try next model
      if (status === 429 || errMsg.includes('rate') || errMsg.includes('limit')) {
        console.log(`[AI] Rate limit on ${model}, trying next...`);
        continue;
      }

      // Model not available — try next
      if (status === 404 || status === 400 || errMsg.includes('not found')) {
        console.log(`[AI] Model ${model} unavailable, trying next...`);
        continue;
      }

      // Any other error — try next model
      console.log(`[AI] Error on ${model}: ${errMsg} — trying next...`);
      continue;
    }
  }

  throw new Error('ALL_MODELS_FAILED');
}

router.post('/chat', protect, async (req, res) => {
  try {
    const { message } = req.body;

    if (!process.env.COHERE_API_KEY) {
      return res.json({
        reply: '⚠️ No Cohere API key found. Get a FREE key at https://dashboard.cohere.com/api-keys and add COHERE_API_KEY=... to backend/.env',
      });
    }

    // Per-user cooldown
    const userId = req.user._id.toString();
    const lastRequest = userCooldowns.get(userId) || 0;
    const now = Date.now();
    if (now - lastRequest < COOLDOWN_MS) {
      const waitSec = ((COOLDOWN_MS - (now - lastRequest)) / 1000).toFixed(1);
      return res.json({ reply: `Please wait ${waitSec}s before sending another message.` });
    }
    userCooldowns.set(userId, now);

    // Fetch user's medication context
    const medications = await Medication.find({ user: req.user._id });
    const logs = await DoseLog.find({ user: req.user._id })
      .sort({ scheduledTime: -1 })
      .limit(10)
      .populate('medication');

    const medSummary =
      medications.map((m) => `${m.name} ${m.dosage} (${m.frequency})`).join(', ') || 'none';

    const logSummary =
      logs
        .slice(0, 5)
        .map((l) => `${l.medication?.name || 'Unknown'}: ${l.status}`)
        .join(', ') || 'none';

    const systemPrompt = `You are Vital Care Assistant, a friendly and knowledgeable AI assistant. You can answer ANY question — health advice, medications, general knowledge, science, lifestyle, technology, cooking, and more.

The user's current health context (use only when relevant to their question):
- Medications: ${medSummary}
- Recent dose logs: ${logSummary}

Always respond in a warm, clear, and helpful tone. Keep answers concise (2-4 sentences) unless the question genuinely needs more detail. Never refuse to answer general questions.`;

    try {
      const reply = await generateWithCohere(systemPrompt, message);
      res.json({ reply });
    } catch (apiError) {
      console.error('[AI] Final error:', apiError.message);

      if (apiError.message === 'INVALID_API_KEY') {
        return res.json({
          reply: '⚠️ Your Cohere API key is invalid. Get a fresh free key at https://dashboard.cohere.com/api-keys and update COHERE_API_KEY in backend/.env',
        });
      }

      if (apiError.message === 'NO_KEY') {
        return res.json({
          reply: '⚠️ Add your free Cohere API key to backend/.env as COHERE_API_KEY=... Signup free at https://dashboard.cohere.com',
        });
      }

      return res.json({
        reply: '⚠️ AI is temporarily unavailable. Please try again in a moment.',
      });
    }
  } catch (error) {
    console.error('[AI] Route error:', error);
    res.status(500).json({ reply: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
