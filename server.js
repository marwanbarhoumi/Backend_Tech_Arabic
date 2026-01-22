const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const spellingRoutes = require('./routes/spelling-correction');
const pronunciationRoutes = require("./routes/pronunciation");

const app = express();

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || origin.endsWith(".vercel.app")) {
      callback(null, true);
    } else {
      callback(new Error("CORS blocked"));
    }
  },
  credentials: true
}));

app.options("*", cors());

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/spelling', spellingRoutes);
app.use("/api/pronunciation", pronunciationRoutes);

// Route de test
app.get('/api/test', (req, res) => {
  res.json({ message: '🚀 Backend Arabic AI School is running!' });
});

// Connexion à MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/arabic-ai-school')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});