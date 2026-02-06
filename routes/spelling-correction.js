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
          : "نطق جيد، يحتاج تحسين بسيط",
      mistakes
    });
  }
);

module.exports = router;
