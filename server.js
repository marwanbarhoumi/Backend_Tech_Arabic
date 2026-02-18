const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const dashboardRoutes = require("./routes/dashboard");
const spellingRoutes = require("./routes/spelling-correction");
const pronunciationRoutes = require("./routes/pronunciation");

const app = express();

const allowedOrigins = [/^https:\/\/.*\.vercel\.app$/];

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // Postman / server-to-server

    const isAllowed = allowedOrigins.some((r) => r.test(origin));
    // ✅ ما نرميش Error: نرجع false
    return cb(null, isAllowed);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // ✅ برك هذا

app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/spelling", spellingRoutes);
app.use("/api/pronunciation", pronunciationRoutes);

// ✅ Error handler (باش ما يرجعلكش HTML)
app.use((err, req, res, next) => {
  if (err && String(err.message).toLowerCase().includes("cors")) {
    return res.status(403).json({ success: false, message: "CORS blocked" });
  }
  console.error(err);
  return res.status(500).json({ success: false, message: "Server error" });
});

// Mongo
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/arabic-ai-school")
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
