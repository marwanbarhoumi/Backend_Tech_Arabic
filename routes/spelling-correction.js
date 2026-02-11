const express = require("express");
const { protect } = require("../Middlewares/auth");
const multer = require("multer");
const axios = require("axios");
require("dotenv").config();

const router = express.Router();
const exerciseDatabase = require("../data/exercises");

const upload = multer({ storage: multer.memoryStorage() });

/* ===============================
   GET EXERCISE
================================ */
router.get("/exercise/:level", protect, (req, res) => {
  const level = Number(req.params.level);
  const exercises = exerciseDatabase[level];

  if (!exercises)
    return res.status(404).json({ success: false });

  const random = exercises[Math.floor(Math.random() * exercises.length)];
  res.json({ success: true, exercise: random });
});

/* ===============================
   GENERATE SPEECH (ElevenLabs)
================================ */
router.post("/generate-speech", protect, async (req, res) => {
  const { text } = req.body;

  const response = await axios.post(
    `https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM`,
    { text },
    {
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY,
        "Content-Type": "application/json"
      },
      responseType: "arraybuffer"
    }
  );

  res.send(response.data);
});

/* ===============================
   CHECK PRONUNCIATION (MOCK)
================================ */
router.post(
  "/check",
  protect,
  upload.single("audio"),
  (req, res) => {

    const score = Math.floor(Math.random() * 25) + 70;

    const mistakes =
      score > 90
        ? []
        : [
            {
              word: "ر",
              tip: "حاول إخراج الصوت من طرف اللسان"
            }
          ];

    res.json({
      success: true,
      score,
      feedback:
        score > 90
          ? "نطق ممتاز 👏"
          : "نطق جيد، يحتاج تحسين بسيط ",
      mistakes
    });
  }
);
// ===================================
// POST التصحيح
// ===================================
router.post("/correct", protect, (req, res) => {
  const { text, exerciseId } = req.body;

  if (!text) {
    return res.status(400).json({ success: false, message: "❌ النص مطلوب" });
  }

  const allExercises = Object.values(exerciseDatabase).flat();
  const exercise = allExercises.find((e) => e.id === Number(exerciseId));

  if (!exercise) {
    return res
      .status(404)
      .json({ success: false, message: "❌ التمرين غير موجود" });
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
    if (studentWords[i] === word) correctCount++;
    else {
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
        ? "ممتاز  👏"
        : score >= 80
        ? "جيد جداً ✨"
        : score >= 60
        ? "جيد 📝"
        : score >= 40
        ? "مقبول 🎯"
        : "يحتاج تحسين 🚀"
  };
}

module.exports = router;
