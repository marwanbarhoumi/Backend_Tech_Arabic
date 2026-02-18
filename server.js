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
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    const isAllowed = allowedOrigins.some((r) => r.test(origin));

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS: " + origin));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // ✅ نفس config موش cors()

app.options("*", cors()); // preflight

app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/spelling", spellingRoutes);
app.use("/api/pronunciation", pronunciationRoutes);

// Connexion à MongoDB
mongoose
  .connect(
    process.env.MONGODB_URI || "mongodb://localhost:27017/arabic-ai-school"
  )
  .then(() => console.log("✅ Connected to MongoDB "))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log("ELEVEN FROM SPELLING ROUTE:", process.env.ELEVENLABS_API_KEY);
});
