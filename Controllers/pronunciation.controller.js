const express = require("express");
const multer = require("multer");
const exerciseDatabase = require("../data/exercises");
const compare = require("../utils/compare");
const { textToSpeech, speechToText } = require("../services/eleven.service");
const { protect } = require("../Middlewares/auth");

const router = express.Router();
const upload = multer();

/* =========================
   GET EXERCISE BY LEVEL
========================= */
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

/* =========================
   TEXT TO SPEECH
========================= */
router.post("/generate-speech", protect, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: "text required" });
    }

    const audioBuffer = await textToSpeech(text);

    res.set({ "Content-Type": "audio/mpeg" });
    return res.send(audioBuffer);
  } catch (err) {
    console.error("TTS error:", err.response?.data?.toString() || err.message);
    return res.status(500).json({ success: false, message: "TTS failed" });
  }
});

/* =========================
   CHECK PRONUNCIATION
========================= */
router.post("/check", protect, upload.single("audio"), async (req, res) => {
  try {
    const exerciseId = Number(req.body.exerciseId);

    if (!req.file) {
      return res.status(400).json({ success: false, message: "audio required" });
    }

    const allExercises = Object.values(exerciseDatabase).flat();
    const exercise = allExercises.find((e) => e.id === exerciseId);

    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: "❌ التمرين غير موجود"
      });
    }

    const studentText = await speechToText(req.file.buffer);
    const result = compare(studentText, exercise.correctSentence);

    return res.json({
      success: true,
      recognizedText: studentText,
      targetSentence: exercise.correctSentence,
      ...result
    });
  } catch (err) {
    console.error("Pronunciation check error:", err.response?.data?.toString() || err.message);
    return res.status(500).json({ success: false, message: "check failed" });
  }
});

module.exports = router;
