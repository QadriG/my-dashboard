// server.js
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");
const crypto = require("crypto");

/* -------------------- Config -------------------- */
// Frontend origins (Vite=5173, CRA=3000). Adjust as needed.
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

// MongoDB connection (use Atlas URI or local)
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/quantumcopytrading";

// Your fixed admin (email + hashed password only)
const ADMIN_EMAIL = "info@tradingmachine.ai";
// Replace with your precomputed bcrypt hash (DO NOT store the plain password)
// Example you shared earlier (keep/update as needed):
const ADMIN_HASHED_PASSWORD = "$2b$12$nUUzwUFI0.ItQrtFTFDmjORxnzwNzKvUrcfxPGwaB/0ENe8VXywRq";

// JWT secret rotates on every restart (as you requested)
const JWT_SECRET = crypto.randomBytes(64).toString("hex");

/* -------------------- App & Middleware -------------------- */
const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(helmet());
app.use(bodyParser.json());
app.use(cookieParser());

// Basic rate limiting
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use(apiLimiter);

/* -------------------- DB & Models -------------------- */
const userSchema = new mongoose.Schema(
  {
    username: { type: String },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true }, // bcrypt hash
    role: { type: String, enum: ["admin", "user"], default: "user" },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

/* -------------------- Helpers -------------------- */
function signToken(payload) {
  // 1h expiry, adjust as needed
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
}

function setAuthCookie(res, token) {
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "Lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 1000,
  });
}

/* -------------------- Startup: connect & seed admin -------------------- */
async function start() {
  await mongoose.connect(MONGO_URI, { autoIndex: true });

  // Ensure single admin exists with your fixed email + hashed password
  const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });
  if (!existingAdmin) {
    await User.create({
      username: "mainAdmin",
      email: ADMIN_EMAIL,
      password: ADMIN_HASHED_PASSWORD, // already hashed
      role: "admin",
    });
    console.log("✅ Seeded admin account:", ADMIN_EMAIL);
  } else {
    // Optional: ensure the stored admin password is the exact hash you expect
    if (existingAdmin.password !== ADMIN_HASHED_PASSWORD) {
      existingAdmin.password = ADMIN_HASHED_PASSWORD;
      await existingAdmin.save();
      console.log("🔒 Admin password hash synced to configured hash.");
    }
  }

  app.listen(PORT, () => {
    console.log(`✅ API ready on http://localhost:${PORT}`);
  });
}

/* -------------------- Routes -------------------- */
// Signup (users only; admin email is reserved)
app.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ msg: "All fields required" });
    }

    if (email === ADMIN_EMAIL) {
      return res.status(400).json({ msg: "Admin account already exists." });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ msg: "User already exists" });

    const hashed = await bcrypt.hash(password, 12);
    await User.create({ username, email, password: hashed, role: "user" });

    return res.status(201).json({ msg: "Signup successful. Please login." });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
});

// Login (admin or user)
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ msg: "Invalid credentials" });

    const token = signToken({ id: user._id.toString(), role: user.role });
    setAuthCookie(res, token);

    return res.json({ msg: "Login successful", role: user.role });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
});

// Auth check for ProtectedRoute
app.get("/check-auth", async (req, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ msg: "Not authenticated" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).lean();
    if (!user) return res.status(401).json({ msg: "Invalid token" });

    return res.json({ role: user.role });
  } catch (err) {
    return res.status(401).json({ msg: "Invalid token" });
  }
});

// Logout
app.post("/logout", (req, res) => {
  res.clearCookie("token");
  return res.json({ msg: "Logged out" });
});

/* -------------------- Boot -------------------- */
start().catch((e) => {
  console.error("Failed to start server:", e);
  process.exit(1);
});
