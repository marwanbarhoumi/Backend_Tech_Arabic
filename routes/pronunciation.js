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

  if (!exercises) return res.status(404).json({ success: false });

  const random = exercises[Math.floor(Math.random() * exercises.length)];
  res.json({ success: true, exercise: random });
});

/* =========================
   TEXT TO SPEECH
========================= */
router.post("/generate-speech", protect, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: "No text provided"
      });
    }

    if (!process.env.ELEVENLABS_API_KEY) {
      console.error("❌ ELEVENLABS_API_KEY missing");
      return res.status(500).json({
        success: false,
        message: "API key missing"
      });
    }

    const axios = require("axios");

    const response = await axios.post(
      "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM",
      {
        text,
        model_id: "eleven_multilingual_v2"
      },
      {
        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY,
          "Content-Type": "application/json"
        },
        responseType: "arraybuffer"
      }
    );

    res.set({
      "Content-Type": "audio/mpeg"
    });

    res.send(response.data);
  } catch (error) {
    console.error(
      "🔥 ElevenLabs Pronunciation ERROR:",
      error.response?.data || error.message
    );

    res.status(500).json({
      success: false,
      error: error.response?.data || error.message
    });
  }
});

/* =========================
   CHECK PRONUNCIATION
========================= */
router.post("/check", protect, upload.single("audio"), async (req, res) => {
  try {
    const exerciseId = Number(req.body.exerciseId);

    const allExercises = Object.values(exerciseDatabase).flat();
    const exercise = allExercises.find((e) => e.id === exerciseId);

    if (!exercise)
      return res.status(404).json({
        success: false,
        message: "❌ التمرين غير موجود"
      });

    // 🔥 1) Speech To Text
    const studentText = await speechToText(req.file.buffer);

    // 🔥 2) Compare using same words array
    const result = compare(studentText, exercise.correctSentence);

    res.json({
      success: true,
      recognizedText: studentText,
      targetSentence: exercise.correctSentence,
      ...result
    });
  } catch (err) {
    console.error("Pronunciation check error:", err);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
