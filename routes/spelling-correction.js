const express = require("express");
const { protect } = require("../Middlewares/auth");
const router = express.Router();
require("dotenv").config();
const axios = require("axios");

const exerciseDatabase = require("../data/exercises");
const rateLimitMap = new Map();
const LIMIT_TIME = 5000;

console.log("🔑 تحميل spelling-correction.js...");
console.log("ELEVEN FROM SPELLING ROUTE:", process.env.ELEVENLABS_API_KEY);

// ===================================
// GET تمرين حسب المستوى
// ===================================
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

// ===================================
// POST توليد الصوت (ElevenLabs)
// ===================================
router.post("/generate-speech", protect, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.email || "guest";
    const now = Date.now();

    const lastCall = rateLimitMap.get(userId) || 0;

    if (now - lastCall < LIMIT_TIME) {
      return res.status(429).json({
        success: false,
        message: "⏳ استنى شوية قبل ما تعاود تولّد الصوت"
      });
    }

    rateLimitMap.set(userId, now);

    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "❌ النص مطلوب"
      });
    }

    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    if (!ELEVENLABS_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "❌ ELEVENLABS API KEY غير موجود"
      });
    }

    const voiceId = "21m00Tcm4TlvDq8ikWAM";
    const apiUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

    const response = await axios.post(
      apiUrl,
      { text },
      {
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json"
        },
        responseType: "arraybuffer"
      }
    );

    const audioBase64 = Buffer.from(response.data).toString("base64");
    const audioUrl = `data:audio/mpeg;base64,${audioBase64}`;

    res.json({ success: true, audioUrl });
  } catch (err) {
    console.error(
      "❌ ElevenLabs error:",
      err.response?.data
        ? Buffer.from(err.response.data).toString()
        : err.message
    );

    res.status(500).json({
      success: false,
      message: "❌ خطأ في توليد الصوت"
    });
  }
});


// ===================================
// POST تصحيح الإملاء
// ===================================
router.post("/correct", protect, (req, res) => {
  const { text, exerciseId } = req.body;

  if (!text) {
    return res.status(400).json({
      success: false,
      message: "❌ النص مطلوب"
    });
  }

  const allExercises = Object.values(exerciseDatabase).flat();
  const exercise = allExercises.find(
    (e) => e.id === Number(exerciseId)
  );

  if (!exercise) {
    return res.status(404).json({
      success: false,
      message: "❌ التمرين غير موجود"
    });
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

// ===================================
// دالة المقارنة
// ===================================
function compareWithCorrectSentence(
  studentSentence,
  correctSentence,
  correctWords
) {
  const clean = studentSentence.trim().replace(/\s+/g, " ");
  const studentWords = clean.split(" ");

  let correctCount = 0;
  const mistakes = [];

  correctWords.forEach((word, i) => {
    if (studentWords[i] === word) {
      correctCount++;
    } else {
      mistakes.push({
        position: i + 1,
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
      score === 100
        ? "ممتاز 👏"
        : score >= 80
        ? "جيد جداً ✨"
        : score >= 60
        ? "جيد 📝"
        : score >= 40
        ? "مقبول 🎯"
        : "يحتاج تحسين 🚀"
  };
}

console.log("✅ spelling-correction.js جاهز");
module.exports = router;
