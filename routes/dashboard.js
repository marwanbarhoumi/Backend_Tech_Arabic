const express = require('express');
const User = require('../models/User');
const { protect } = require('../Middlewares/auth');
const router = express.Router();

// @desc    Get user dashboard data
// @route   GET /api/dashboard
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    console.log('📊 Dashboard data requested for user:', user.email);

    // Données des niveaux
    const levelsData = [
      {
        id: 1,
        title: "المستوى المبتدئ",
        description: "تعلم الأساسيات والكلمات البسيطة",
        icon: "🌱",
        progress: 100,
        unlocked: true,
        lessons: [
          { name: "الحروف العربية", completed: true },
          { name: "الكلمات الأساسية", completed: true },
          { name: "الجمل البسيطة", completed: true }
        ]
      },
      {
        id: 2,
        title: "المستوى المتوسط",
        description: "تحسين القراءة والفهم", 
        icon: "📚",
        progress: 80,
        unlocked: true,
        lessons: [
          { name: "القواعد الأساسية", completed: true },
          { name: "قراءة النصوص", completed: true },
          { name: "الإملاء البسيط", completed: false }
        ]
      },
      {
        id: 3, 
        title: "إملاء متقدم",
        description: "تحسين الكتابة والإملاء",
        icon: "✍️",
        progress: 45,
        unlocked: true,
        lessons: [
          { name: "همزة القطع والوصل", completed: true },
          { name: "التاء المربوطة والمفتوحة", completed: true },
          { name: "اللام الشمسية والقمرية", completed: false },
          { name: "كتابة الجمل الطويلة", completed: false }
        ]
      },
      {
        id: 4,
        title: "قراءة النصوص", 
        description: "فهم النصوص الأدبية والعلمية",
        icon: "📖",
        progress: 20,
        unlocked: true,
        lessons: [
          { name: "القصص القصيرة", completed: true },
          { name: "المقالات الأدبية", completed: false },
          { name: "النصوص العلمية", completed: false }
        ]
      },
      {
        id: 5,
        title: "التحدث والاستماع",
        description: "تحسين النطق والفهم السماعي",
        icon: "🎧", 
        progress: 0,
        unlocked: user.progress.level >= 4,
        lessons: [
          { name: "النطق الصحيح", completed: false },
          { name: "فهم المحادثات", completed: false },
          { name: "التحدث بطلاقة", completed: false }
        ]
      },
      {
        id: 6,
        title: "الإبداع في الكتابة",
        description: "كتابة القصص والتعبير",
        icon: "🖋️",
        progress: 0,
        unlocked: user.progress.level >= 5,
        lessons: [
          { name: "كتابة القصص", completed: false },
          { name: "التعبير الكتابي", completed: false },
          { name: "الوصف الأدبي", completed: false }
        ]
      }
    ];

    // Calcul des statistiques
    const totalLessons = levelsData.reduce((acc, level) => acc + level.lessons.length, 0);
    const completedLessons = levelsData.reduce((acc, level) => 
      acc + level.lessons.filter(lesson => lesson.completed).length, 0
    );
    const overallProgress = Math.round((completedLessons / totalLessons) * 100);

    res.json({
      success: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        level: user.progress.level,
        points: user.progress.points,
        overallProgress,
        lastLogin: user.lastLogin
      },
      levels: levelsData,
      stats: {
        totalLessons,
        completedLessons, 
        overallProgress,
        currentLevel: user.progress.level,
        points: user.progress.points
      }
    });

  } catch (error) {
    console.error('❌ Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تحميل بيانات Dashboard'
    });
  }
});

// @desc    Complete a lesson
// @route   POST /api/dashboard/complete-lesson
// @access  Private
router.post('/complete-lesson', protect, async (req, res) => {
  try {
    const { levelId, lessonName } = req.body;

    console.log('🎯 Completing lesson:', { levelId, lessonName, userId: req.user.id });

    const pointsEarned = 10;
    const user = await User.findById(req.user.id);
    
    user.progress.points += pointsEarned;
    
    // Augmenter le niveau si nécessaire
    if (levelId > user.progress.level) {
      user.progress.level = levelId;
    }

    await user.save();

    res.json({
      success: true,
      message: `🎉 مبروك! أكملت درس "${lessonName}"`,
      pointsEarned,
      totalPoints: user.progress.points,
      newLevel: user.progress.level
    });

  } catch (error) {
    console.error('❌ Complete lesson error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إكمال الدرس'
    });
  }
});

// @desc    Get AI exercises
// @route   GET /api/dashboard/ai-exercises  
// @access  Private
router.get('/ai-exercises', protect, async (req, res) => {
  try {
    const aiExercises = [
      {
        id: 1,
        title: "✍️ تصحيح الإملاء الآلي",
        description: "اكتب جملة وسيقوم الذكاء الاصطناعي بتصحيحها",
        type: "spelling",
        difficulty: "medium",
        points: 15
      },
      {
        id: 2,
        title: "🎤 تمارين النطق",
        description: "تدرب على النطق الصحيح للحروف والكلمات",
        type: "pronunciation",
        difficulty: "easy", 
        points: 10
      },
      {
        id: 3,
        title: "📝 توليد تمارين شخصية",
        description: "احصل على تمارين مخصصة لمستواك", 
        type: "personalized",
        difficulty: "varies",
        points: 20
      }
    ];

    res.json({
      success: true,
      exercises: aiExercises
    });

  } catch (error) {
    console.error('❌ AI exercises error:', error);
    res.status(500).json({
      success: false, 
      message: 'خطأ في تحميل تمارين الذكاء الاصطناعي'
    });
  }
});

// @desc    Update user profile
// @route   PUT /api/dashboard/profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const { fullName } = req.body;

    const user = await User.findById(req.user.id);
    user.fullName = fullName;

    await user.save();

    res.json({
      success: true,
      message: 'تم تحديث الملف الشخصي بنجاح',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email
      }
    });

  } catch (error) {
    console.error('❌ Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث الملف الشخصي'
    });
  }
});

module.exports = router; 