import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";
import cookieParser from "cookie-parser";
import crypto from "crypto";

// Add in-memory blacklist
const tokenBlacklist = new Set();

const router = express.Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

// Middleware to parse cookies
router.use(cookieParser());

// Helper: set auth cookie
const setAuthCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
    path: "/",
  });
};

// ---------------- SIGNUP ----------------
router.post("/signup", async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: role || "user",
        isVerified: false,
        verificationToken,
      },
    });

    const verificationLink = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
    await sendEmail(
      user.email,
      "Verify Your Email",
      `<p>Hello,</p><p>Please verify your email by clicking <a href="${verificationLink}">here</a>.</p>`
    );

    res.json({ message: "Please check your email to verify your account." });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------- LOGIN ----------------
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password required" });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    if (!user.isVerified) return res.status(403).json({ message: "Please verify your email first" });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "365d" });
    setAuthCookie(res, token);

    res.json({
      message: "Login successful",
      user: { id: user.id, email: user.email, role: user.role },
      token, // For debugging
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------- CHECK AUTH ----------------
router.get("/check-auth", async (req, res) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
    console.log("Check-auth token:", token); // Debug
    if (!token) return res.status(401).json({ message: "No token provided" });
    if (tokenBlacklist.has(token)) {
      return res.status(401).json({ message: "Token blacklisted" });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return res.status(401).json({ message: "User not found" });
    res.json({ id: user.id, role: user.role, email: user.email });
  } catch (err) {
    console.error("Check auth error:", err.message);
    res.status(401).json({ message: "Invalid or expired token" });
  }
});

// ---------------- VERIFY EMAIL ----------------
router.get("/verify-email/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const user = await prisma.user.findFirst({ where: { verificationToken: token } });

    if (!user || user.isVerified) {
      return res.status(400).json({ message: "Invalid or already verified token" });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, verificationToken: null },
    });

    res.json({ message: "Email verified successfully. You can now log in." });
  } catch (err) {
    console.error("Verification error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------- LOGOUT ----------------
router.post("/logout", (req, res) => {
  const token = req.cookies.token;
  if (token) tokenBlacklist.add(token);

  res
    .status(200)
    .set({
      "Set-Cookie": "token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax",
    })
    .json({ message: "Logged out successfully" });
});

// ---------------- REFRESH TOKEN ----------------
router.post("/refresh-token", async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "No token provided" });
    if (tokenBlacklist.has(token)) {
      return res.status(401).json({ message: "Token blacklisted" });
    }
    const decoded = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true });
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return res.status(401).json({ message: "User not found" });
    const newToken = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "365d" });
    setAuthCookie(res, newToken);
    res.json({ message: "Token refreshed", token: newToken });
  } catch (err) {
    console.error("Refresh token error:", err);
    res.status(401).json({ message: "Invalid token" });
  }
});

// ---------------- FORGOT PASSWORD ----------------
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ message: "User not found" });

    const resetToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "15m" });
    const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset",
      text: `Click this link to reset your password: ${resetLink}`,
    });

    res.json({ message: "Password reset email sent" });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;