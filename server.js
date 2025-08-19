import express from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import bodyParser from "body-parser";
import crypto from "crypto";
import { sendEmail } from "./src/utils/mailer.js";

dotenv.config();
const app = express();
const prisma = new PrismaClient();

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

// Middleware
app.use(bodyParser.json());
app.use(cookieParser());
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = process.env.CORS_WHITELIST
        ? process.env.CORS_WHITELIST.split(",")
        : ["http://localhost:3000"];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(helmet());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  })
);

// ---------- Auth Middleware ----------
const authMiddleware = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!req.user) return res.status(401).json({ error: "User not found" });
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
};

// ---------- SIGNUP ----------
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: "All fields required" });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing)
      return res.status(400).json({ error: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role: "user" },
    });

    // Send welcome email
    try {
      await sendEmail(
        user.email,
        "Welcome to QuantumCopyTrading!",
        `<p>Hello ${name},</p>
         <p>Welcome to QuantumCopyTrading! Your account has been created successfully.</p>`
      );
    } catch (err) {
      console.error("Failed to send welcome email:", err);
    }

    res.json({ message: "User created", user: { id: user.id, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ---------- LOGIN ----------
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "1d" });
    res
      .cookie("token", token, { httpOnly: true, secure: false })
      .json({
        message: "Login successful",
        user: { id: user.id, email: user.email, role: user.role },
      });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// ---------- FORGOT PASSWORD ----------
app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: "Email not found" });

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExp = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.user.update({
      where: { email },
      data: { resetToken, resetTokenExp: resetExp },
    });

    const resetLink = `http://localhost:3000/my-dashboard/reset-password/${resetToken}`;

    try {
      await sendEmail(
        email,
        "Reset your QuantumCopyTrading password",
        `<p>Hello ${user.name || "User"},</p>
         <p>Click the link below to reset your password:</p>
         <a href="${resetLink}" target="_blank">Reset Password</a>
         <p>This link will expire in 15 minutes.</p>`
      );
    } catch (err) {
      console.error("Failed to send reset email:", err);
    }

    res.json({ message: "Password reset email sent" });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// ---------- RESET PASSWORD ----------
app.post("/api/auth/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExp: { gt: new Date() },
      },
    });

    if (!user) return res.status(400).json({ error: "Invalid or expired token" });

    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed, resetToken: null, resetTokenExp: null },
    });

    res.json({ message: "Password reset successful" });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// ---------- Start Server ----------
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
