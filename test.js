const express = require('express'); 
const { protect } = require('../Middlewares/auth');
const router = express.Router();
require('dotenv').config();
const axios = require('axios');

console.log('🔑 تحميل spelling-correction.js...');

// قاعدة بيانات الجمل
const exerciseDatabase = {
  1: [
    { id: 101, correctSentence: "اللغة العربية جميلة.", words: ["اللغة","العربية","جميلة"] },
    { id: 102, correctSentence: "ذهب الطالب إلى المدرسة.", words: ["ذهب","الطالب","إلى","المدرسة"] }
  ],
  2: [
    { id: 201, correctSentence: "الشمس تشرق كل صباح.", words: ["الشمس","تشرق","كل","صباح"] }
  ],
  3: [
    { id: 301, correctSentence: "المعرفة هي مفتاح النجاح.", words: ["المعرفة","هي","مفتاح","النجاح"] }
  ],
  4: [
    { id: 401, correctSentence: "الاجتهاد طريق التفوق.", words: ["الاجتهاد","طريق","التفوق"] }
  ],
  5: [
    { id: 501, correctSentence: "العلم نور والجهل ظلام.", words: ["العلم","نور","والجهل","ظلام"] }
  ],
  6: [
    { id: 601, correctSentence: "من جدّ وجد ومن زرع حصد.", words: ["من","جدّ","وجد","ومن","زرع","حصد"] }
  ]
};


// ===================================
// endpoint توليد الصوت باستخدام ElevenLabs
// ===================================
router.post('/generate-speech', protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim() === '') return res.status(400).json({ success: false, message: "❌ النص مطلوب لتوليد الصوت" });

    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    if (!ELEVENLABS_API_KEY) return res.status(500).json({ success: false, message: "❌ ELEVENLABS_API_KEY غير موجود" });

    const voiceId = "21m00Tcm4TlvDq8ikWAM"; // مثال صوت عربي
    const apiUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

    const response = await axios.post(
      apiUrl,
      { text },
      {
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer'
      }
    );

    // تحويل الصوت ل Base64
    const audioBase64 = Buffer.from(response.data, 'binary').toString('base64');
    const audioUrl = `data:audio/mpeg;base64,${audioBase64}`;

    return res.json({
      success: true,
      message: "✅ تم توليد الصوت باستخدام ElevenLabs",
      audioUrl,
      text,
      provider: "elevenlabs-api"
    });

  } catch (err) {
    console.error("❌ خطأ في توليد الصوت:", err.response?.data || err.message);
    res.status(500).json({ success: false, message: "❌ حدث خطأ أثناء توليد الصوت" });
  }
});
router.get('/exercise/:level', protect, (req, res) => {
  const level = Number(req.params.level);
  const exercises = exerciseDatabase[level];

  if (!exercises) {
    return res.status(404).json({ success:false, message:"❌ المستوى غير موجود" });
  }

  const random = exercises[Math.floor(Math.random() * exercises.length)];
  res.json({ success:true, exercise: random });
});

// ===================================
// endpoint التصحيح
// ===================================
router.post('/correct', protect, async (req, res) => {
  try {
    const { text, exerciseId } = req.body;
    if (!text) return res.status(400).json({ success: false, message: "❌ النص مطلوب للتصحيح" });

    const allExercises = Object.values(exerciseDatabase).flat();
const exercise = allExercises.find(ex => ex.id === parseInt(exerciseId));

    if (!exercise) return res.status(404).json({ success: false, message: "❌ لم يتم العثور على التمرين" });

    const result = compareWithCorrectSentence(text, exercise.correctSentence, exercise.words);
    res.json({ success: true, ...result, originalText: text, correctedText: exercise.correctSentence, targetSentence: exercise.correctSentence });

  } catch (err) {
    console.error("❌ خطأ في التصحيح:", err);
    res.status(500).json({ success: false, message: "❌ حدث خطأ في الخادم" });
  }
});

// ===================================
// دالة المقارنة
// ===================================
function compareWithCorrectSentence(studentSentence, correctSentence, correctWords) {
  const studentClean = studentSentence.trim().replace(/[.,!?;:]$/g, '').replace(/\s+/g, ' ');
  const studentWords = studentClean.split(' ').filter(w => w.length > 0);
  const result = { score: 0, mistakes: [], isPerfect: false, feedback: "" };

  if (studentClean === correctSentence) { result.score = 100; result.isPerfect = true; result.feedback = "ممتاز! 👏 الكتابة صحيحة تماماً"; return result; }

  let correctCount = 0;
  for (let i = 0; i < correctWords.length; i++) {
    const studentWord = studentWords[i], correctWord = correctWords[i];
    if (studentWord === correctWord) correctCount++;
    else result.mistakes.push({
      position: i+1,
      original: studentWord || "[ناقصة]",
      corrected: correctWord,
      type: studentWord ? "إملائي" : "نقص",
      explanation: studentWord ? `كتبت "${studentWord}" والصحيح "${correctWord}"` : `كلمة ناقصة: ${correctWord}`
    });
  }

  result.score = Math.round((correctCount / correctWords.length) * 100);
  result.isPerfect = (result.score === 100);
  if (result.score === 100) result.feedback = "ممتاز! 👏 الكتابة صحيحة تماماً";
  else if (result.score >= 80) result.feedback = "جيد جداً! ✨ مع بعض الأخطاء البسيطة";
  else if (result.score >= 60) result.feedback = "جيد! 📝 تحتاج لمزيد من التدقيق";
  else if (result.score >= 40) result.feedback = "مقبول 🎯 استمر في الممارسة";
  else result.feedback = "يحتاج تحسين 🚀 راجع قواعد الإملاء";

  return result;
}

console.log('✅ spelling-correction.js جاهز');
module.exports = router;
