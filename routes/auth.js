const express = require('express');
const User = require('../models/User');
const { generateToken } = require('../Middlewares/auth')
const router = express.Router();

// @desc    Register user
// @route   POST /api/auth/signup
// @access  Public
router.post('/signup', async (req, res) => {
  try {
    const { fullName, email, password, confirmPassword } = req.body;

    // Validation
    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'جميع الحقول مطلوبة'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'كلمات المرور غير متطابقة'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
      });
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'البريد الإلكتروني مستخدم بالفعل'
      });
    }

    // Créer l'utilisateur
    const user = await User.create({
      fullName,
      email,
      password
    });

    // Générer le token
    const token = generateToken(user._id);

    // Mettre à jour lastLogin
    await user.updateLastLogin();

    res.status(201).json({
      success: true,
      message: '🎉 تم إنشاء الحساب بنجاح!',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        progress: user.progress
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر'
    });
  }
});

// @desc    Login user
// @route   POST /api/auth/signin
// @access  Public
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'البريد الإلكتروني وكلمة المرور مطلوبان'
      });
    }

    // Vérifier l'utilisateur et le mot de passe
    const user = await User.findOne({ email }).select('+password');
    
    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
      });
    }

    // Vérifier si le compte est actif
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'الحساب معطل، يرجى التواصل مع الإدارة'
      });
    }

    // Générer le token
    const token = generateToken(user._id);

    // Mettre à jour lastLogin
    await user.updateLastLogin();

    res.json({
      success: true,
      message: '🎉 تم تسجيل الدخول بنجاح!',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        progress: user.progress,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر'
    });
  }
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', async (req, res) => {
  try {
    // Cette route nécessite le middleware protect
    const user = await User.findById(req.user.id);
    
    res.json({
      success: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        progress: user.progress,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر'
    });
  }
});

module.exports = router;