const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const dashboardRoutes = require("./routes/dashboard");
const spellingRoutes = require("./routes/spelling-correction");
const pronunciationRoutes = require("./routes/pronunciation");

const app = express();

// ✅ CORS (Production + Vercel previews + localhost)
const allowedOrigins = [
  /^https?:\/\/localhost:\d+$/,
  /^https?:\/\/.*\.vercel\.app$/,
  /^https?:\/\/frontend-tech-arabic\.vercel\.app$/, // (اختياري) الدومين الرئيسي
];

const corsOptions = {
  origin: function (origin, callback) {
    // requests بدون origin (Postman, server-to-server)
    if (!origin) return callback(null, true);

    const ok = allowedOrigins.some((r) => r.test(origin));
    if (ok) return callback(null, true);

    return callback(new Error("Not allowed by CORS: " + origin));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));

// ✅ أهم سطر: preflight لازم نفس corsOptions (موش cors() وحدها)
app.options("*", cors(corsOptions));

app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/spelling", spellingRoutes);
app.use("/api/pronunciation", pronunciationRoutes);

// Test route
app.get("/api/test", (req, res) => {
  res.json({ message: "🚀 Backend Arabic AI School is running!" });
});

// Mongo
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/arabic-ai-school")
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
