const express = require("express");
const { protect } = require("../Middlewares/auth");
const router = express.Router();
require("dotenv").config();
const axios = require("axios");
const multer = require("multer");

const exerciseDatabase = require("../data/exercises");

console.log("🎤 تحميل pronunciation.js...");

// ===============================
// Multer (audio upload)
// ===============================
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// ===============================
// GET جملة حسب المستوى
// ===============================
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

// ===============================
// POST توليد الصوت (ElevenLabs)
// ===============================
router.post("/generate-speech", protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: "❌ النص مطلوب" });
    }

    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    if (!ELEVENLABS_API_KEY) {
      return res
        .status(500)
        .json({ success: false, message: "❌ API KEY غير موجود" });
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
    console.error(err.message);
    res.status(500).json({ success: false, message: "❌ خطأ في توليد الصوت" });
  }
});

// ===============================
// POST تحليل النطق (Audio)
// ===============================
router.post(
  "/check",
  protect,
  upload.single("audio"),
  (req, res) => {
    try {
      const { sentence, exerciseId } = req.body;
      const audio = req.file;

      if (!audio) {
        return res
          .status(400)
          .json({ success: false, message: "❌ الصوت مطلوب" });
      }

      const allExercises = Object.values(exerciseDatabase).flat();
      const exercise = allExercises.find(
        (e) => e.id === Number(exerciseId)
      );

      if (!exercise) {
        return res
          .status(404)
          .json({ success: false, message: "❌ التمرين غير موجود" });
      }

      // ===============================
      // MOCK تحليل النطق (ذكي)
      // ===============================
      const analysis = analyzePronunciationMock(sentence);

      res.json({
        success: true,
        score: analysis.score,
        mistakes: analysis.mistakes,
        feedback: analysis.feedback,
        targetSentence: exercise.correctSentence
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({
        success: false,
        message: "❌ خطأ في تحليل النطق"
      });
    }
  }
);

// ===============================
// دالة تحليل النطق (Mock)
// ===============================
function analyzePronunciationMock(sentence) {
  const baseScore = Math.floor(Math.random() * 25) + 70; // 70 → 95

  const mistakesCount =
    baseScore > 90 ? 0 : baseScore > 80 ? 1 : 2;

  const mistakes = [];

  if (mistakesCount >= 1) {
    mistakes.push({
      word: "ر",
      issue: "نطق غير واضح",
      tip: "حاول إخراج الصوت من طرف اللسان"
    });
  }

  if (mistakesCount >= 2) {
    mistakes.push({
      word: "ق",
      issue: "تفخيم ضعيف",
      tip: "ركز على تفخيم الحرف من الحلق"
    });
  }

  let feedback =
    baseScore >= 90
      ? "نطق ممتاز 👏"
      : baseScore >= 80
      ? "نطق جيد، يحتاج تحسين بسيط ✨"
      : "حاول مرة أخرى وركز على مخارج الحروف 🎯";

  return {
    score: baseScore,
    mistakes,
    feedback
  };
}

console.log("✅ pronunciation.js جاهز");
module.exports = router;
