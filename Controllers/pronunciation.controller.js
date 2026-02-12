const { textToSpeech, speechToText } = require("../services/eleven.service");
const normalizeArabic = require("../utils/arabicNormalizer");
const scorePronunciation = require("../utils/pronunciationScorer");

const sentences = [
  "اللغة العربية جميلة",
  "أنا أحب تعلم البرمجة",
  "الطقس اليوم مشمس",
  "العلم نور والجهل ظلام",
  "القراءة غذاء العقل"
];

// 🎯 Generate Exercise
exports.generateExercise = async (req, res) => {
  try {
    const random = sentences[Math.floor(Math.random() * sentences.length)];
    res.json({ sentence: random });
  } catch (err) {
    res.status(500).json({ message: "Exercise error" });
  }
};

// 🔊 Generate Speech
exports.generateSpeech = async (req, res) => {
  try {
    const { text } = req.body;

    const audioBuffer = await textToSpeech(text);

    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Length": audioBuffer.length,
    });

    res.send(audioBuffer);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ message: "TTS error" });
  }
};

// 🎤 Check Pronunciation
exports.checkPronunciation = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No audio file uploaded" });
    }

    const { originalText } = req.body;

    // 🔥 Speech to Text
    const transcription = await speechToText(req.file.buffer);

    // 🔥 Normalize Arabic
    const cleanOriginal = normalizeArabic(originalText);
    const cleanUser = normalizeArabic(transcription);

    // 🔥 Score
    const result = scorePronunciation(cleanOriginal, cleanUser);

    res.json({
      originalText,
      transcription,
      ...result
    });

  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ message: "Pronunciation check error" });
  }
};
