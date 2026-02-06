const express = require("express");
const { protect } = require("../Middlewares/auth");
const router = express.Router();
const axios = require("axios");
require("dotenv").config();

const exerciseDatabase = require("../data/exercises");

// simple rate limit per user
const rateLimitMap = new Map();
const LIMIT_TIME = 5000;

// ================================
// GET exercise by level
// ================================
router.get("/exercise/:level", protect, (req, res) => {
  const level = Number(req.params.level);
  const exercises = exerciseDatabase[level];

  if (!exercises) {
    return res.status(404).json({
      success: false,
      message: "❌ المستوى غير موجود"
    });
  }

  const random = exercises[Math.floor(Math.random() * exercises.length)];

  res.json({
    success: true,
    exercise: random
  });
});

// ================================
// POST generate speech (ElevenLabs)
// ================================
router.post("/generate-speech", protect, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.email || "guest";
    const now = Date.now();

    const lastCall = rateLimitMap.get(userId) || 0;
    if (now - lastCall < LIMIT_TIME) {
      return res.status(429).json({ message: "Rate limit" });
    }
    rateLimitMap.set(userId, now);

    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Text required" });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ message: "TTS unavailable" });
    }

    const voiceId = "21m00Tcm4TlvDq8ikWAM";
    const apiUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

    const response = await axios.post(
      apiUrl,
      { text },
      {
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json"
        },
        responseType: "arraybuffer"
      }
    );

    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Length": response.data.length
    });

    res.send(response.data);

  } catch (err) {
    console.error("❌ ElevenLabs error:", err.response?.status || err.message);
    res.status(503).json({ message: "TTS service unavailable" });
  }
});

// ================================
// POST spelling correction
// ================================
router.post("/correct", protect, (req, res) => {
  const { text, exerciseId } = req.body;

  if (!text) {
    return res.status(400).json({ success: false, message: "❌ النص مطلوب" });
  }

  const allExercises = Object.values(exerciseDatabase).flat();
  const exercise = allExercises.find(e => e.id === Number(exerciseId));

  if (!exercise) {
    return res.status(404).json({ success: false, message: "❌ التمرين غير موجود" });
  }

  const result = compareWithCorrectSentence(
    text,
    exercise.correctSentence,
    exercise.words
  );

  res.json({
    success: true,
    ...result,
    originalText: text,
    correctedText: exercise.correctSentence,
    targetSentence: exercise.correctSentence
  });
});

function compareWithCorrectSentence(studentSentence, correctSentence, correctWords) {
  const clean = studentSentence.trim().replace(/\s+/g, " ");
  const studentWords = clean.split(" ");

  let correctCount = 0;
  const mistakes = [];

  correctWords.forEach((word, i) => {
    if (studentWords[i] === word) correctCount++;
    else {
      mistakes.push({
        original: studentWords[i] || "[ناقصة]",
        corrected: word,
        type: studentWords[i] ? "إملائي" : "نقص"
      });
    }
  });

  const score = Math.round((correctCount / correctWords.length) * 100);

  return {
    score,
    mistakes,
    isPerfect: score === 100,
    feedback:
      score === 100 ? "ممتاز 👏" :
      score >= 80 ? "جيد جداً ✨" :
      score >= 60 ? "جيد 📝" :
      score >= 40 ? "مقبول 🎯" :
      "يحتاج تحسين 🚀"
  };
}

module.exports = router;
