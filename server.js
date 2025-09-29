// === Imports ===
import express from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import bodyParser from "body-parser";
import crypto from "crypto";

// Utils & services
import { sendEmail } from "./src/utils/mailer.js";
import webhookRoutes from "./server/routes/webhookRoutes.mjs";
import adminRoutes from "./server/routes/adminRoutes.mjs";   // existing admin routes
import exchangesRoutes from "./server/routes/exchanges.mjs";
import logger from "./server/utils/logger.mjs";
import encryptUtils from "./server/utils/encrypt.mjs";
import positionsRouter from "./server/routes/positions.mjs";
import usersRouter from "./server/routes/users.mjs";
import balancesRouter from "./server/routes/balances.mjs";



// === Setup ===
dotenv.config();
const app = express();
const prisma = new PrismaClient();
const { info, error: logError } = logger;
const { encryptPassword, comparePassword } = encryptUtils;

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
const SERVER_URL = process.env.SERVER_URL || `http://localhost:${PORT}`;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

// === Middleware ===
app.use(bodyParser.json());
app.use(cookieParser());
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = process.env.CORS_WHITELIST
        ? process.env.CORS_WHITELIST.split(",")
        : ["http://localhost:3000", "http://localhost:5173"];
      if (!origin || allowedOrigins.includes(origin)) callback(null, true);
      else callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(helmet());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// === Helper: auth cookie ===
const setAuthCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

// === Auth middleware ===
const authMiddleware = async (req, res, next) => {
  try {
    let token = req.cookies?.token;
    if (!token && req.headers.authorization) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (!token) return res.status(401).json({ error: "Unauthorized: No token" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return res.status(401).json({ error: "Unauthorized: User not found" });

    // 🚨 Block paused/disabled users
    if (user.status === "paused" || user.status === "disabled") {
      return res.status(403).json({ error: `Your account is ${user.status}` });
    }

    // 🚨 Token invalidation check
    if (decoded.tokenVersion !== user.tokenVersion) {
      return res.status(401).json({ error: "Token invalidated. Please log in again." });
    }

    req.user = user;
    next();
  } catch (err) {
    logError("Auth middleware error:", err);
    return res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
  }
};

// === Admin middleware ===
const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: Admins only" });
  }
  next();
};

// === Routes ===
app.use("/api/positions", positionsRouter);
app.use("/api/exchanges", exchangesRoutes);
app.use("/api/webhook", webhookRoutes);

// Mount admin routes
app.use("/api/admin", authMiddleware, adminMiddleware, adminRoutes);

app.use("/api/users", usersRouter);
app.use("/api/balances", balancesRouter);

// === Auth Routes ===
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields required" });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ message: "Email already registered" });

    const hashed = await encryptPassword(password);
    const role = email === "info@tradingmachine.ai" ? "admin" : "user";

    const user = await prisma.user.create({
      data: { name, email, password: hashed, role, isVerified: false, tokenVersion: 1 },
    });

    const verifyToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "1d" });
    await prisma.user.update({ where: { id: user.id }, data: { verificationToken: verifyToken } });

    const verifyLink = `${SERVER_URL}/api/auth/verify-email?token=${encodeURIComponent(
      verifyToken
    )}`;

    try {
      await sendEmail(
        user.email,
        "Verify your QuantumCopyTrading account",
        `<p>Hello ${name},</p>
         <p>Please verify your email by clicking below:</p>
         <p><a href="${verifyLink}" target="_blank">Verify Email</a></p>
         <p>Link expires in 24h.</p>`
      );
    } catch (err) {
      logError("Failed to send verification email:", err);
    }

    res.json({ message: "Signup successful! Check email to verify account." });
  } catch (err) {
    logError("Signup error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// === LOGIN ===
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });
    if (!user.isVerified) return res.status(403).json({ message: "Email not verified" });

    // Block paused/disabled accounts
    if (user.status === "paused" || user.status === "disabled") {
      return res.status(403).json({ message: `Your account is ${user.status}` });
    }

    const valid = await comparePassword(password, user.password);
    if (!valid) return res.status(400).json({ message: "Invalid credentials" });

    // Include tokenVersion in JWT
    const token = jwt.sign(
      { id: user.id, role: user.role, tokenVersion: user.tokenVersion },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    setAuthCookie(res, token);

    res.json({
      message: "Login successful",
      user: { id: user.id, email: user.email, role: user.role, status: user.status },
    });
  } catch (err) {
    logError("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// === CHECK AUTH ===
app.get("/api/auth/check-auth", authMiddleware, async (req, res) => {
  const user = req.user;
  res.json({
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
    isVerified: user.isVerified,
  });
});

// === FORGOT PASSWORD ===
app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ message: "Email not found" });

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExp = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.user.update({
      where: { email },
      data: { resetToken, resetTokenExp: resetExp },
    });

    const resetLink = `${CLIENT_URL}/my-dashboard/reset-password/${resetToken}`;
    try {
      await sendEmail(
        email,
        "Reset your QuantumCopyTrading password",
        `<p>Hello ${user.name || "User"},</p>
         <p>Click below to reset your password:</p>
         <a href="${resetLink}" target="_blank">Reset Password</a>
         <p>Link expires in 15 min.</p>`
      );
    } catch (err) {
      logError("Failed reset email:", err);
    }

    res.json({ message: "Password reset email sent" });
  } catch (err) {
    logError("Forgot password error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// === RESET PASSWORD ===
app.post("/api/auth/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await prisma.user.findFirst({
      where: { resetToken: token, resetTokenExp: { gt: new Date() } },
    });
    if (!user) return res.status(400).json({ message: "Invalid or expired token" });

    const hashed = await encryptPassword(password);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed, resetToken: null, resetTokenExp: null },
    });

    res.json({ message: "Password reset successful" });
  } catch (err) {
    logError("Reset password error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// === LOGOUT ===
app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
  return res.json({ message: "Logged out" });
});

// === Extra secured routes ===
app.get("/user/profile", authMiddleware, (req, res) => {
  res.json({ user: req.user });
});
app.get("/admin/dashboard", authMiddleware, adminMiddleware, (req, res) => {
  res.json({ message: "Welcome Admin", user: req.user });
});

// === Start server ===
app.listen(PORT, () => info(`🚀 Server running on port ${PORT}`));

