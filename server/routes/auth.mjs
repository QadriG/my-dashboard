// authRoutes.mjs
import express from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import { hashPassword, comparePassword } from "../utils/encrypt.mjs";
import { info, error as logError } from "../utils/logger.mjs";
import { sendEmail } from "../utils/mailer.mjs";

dotenv.config();

const router = express.Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";
const JWT_EXPIRES_IN = "7d"; // 7 days

// ========================
// ✅ Register
// ========================
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await hashPassword(password);
    const verificationToken = crypto.randomBytes(32).toString("hex");

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "user",
        verificationToken,
      },
    });

    // Send verification email with backend URL
    const verifyUrl = `${process.env.BACKEND_URL}/api/auth/verify-email/${verificationToken}`;
    await sendEmail(newUser.email, "Verify Your Email", `Click here to verify: ${verifyUrl}`);

    info(`New user registered: ${newUser.email} (ID: ${newUser.id})`);

    res.status(201).json({
      message: "User registered successfully. Please check your email to verify your account.",
      user: { id: newUser.id, name: newUser.name, email: newUser.email },
    });
  } catch (err) {
    logError("Error registering user", err);
    res.status(500).json({ message: "Error registering user", error: err.message });
  }
});

// ========================
// ✅ Verify Email (redirect)
// ========================
router.get("/verify-email/:token", async (req, res) => {
  const { token } = req.params;
  try {
    const user = await prisma.user.findFirst({ where: { verificationToken: token } });
    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL}/verify-failed`);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, verificationToken: null },
    });

    res.redirect(`${process.env.FRONTEND_URL}/login?verified=success`);
  } catch (err) {
    logError("Error verifying email", err);
    res.redirect(`${process.env.FRONTEND_URL}/verify-failed`);
  }
});

// ========================
// ✅ Login
// ========================
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: "Please verify your email before logging in." });
    }

    if (user.status === "paused") {
      return res.status(403).json({ message: "Your account is paused. Contact admin." });
    }
    if (user.status === "disabled") {
      return res.status(403).json({ message: "Your account is disabled. Contact admin." });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, tokenVersion: user.tokenVersion },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    info(`User logged in: ${user.email} (ID: ${user.id})`);

    res.json({
      message: "Login successful",
      token,
      user: { id: user.id, name: user.name, role: user.role, status: user.status },
    });
  } catch (err) {
    logError("Error logging in", err);
    res.status(500).json({ message: "Error logging in", error: err.message });
  }
});

// ========================
// ✅ Forgot Password
// ========================
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: "No account with that email" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExp = new Date(Date.now() + 1000 * 60 * 15); // 15 min

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExp },
    });

    const resetUrl = `${process.env.BACKEND_URL}/api/auth/reset-password/${resetToken}`;
    await sendEmail(user.email, "Password Reset", `Reset your password: ${resetUrl}`);

    res.json({ message: "Password reset link sent to your email" });
  } catch (err) {
    logError("Error sending reset link", err);
    res.status(500).json({ message: "Error sending reset link", error: err.message });
  }
});

// ========================
// ✅ Validate Reset Token (redirect)
// ========================
router.get("/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  try {
    const user = await prisma.user.findFirst({
      where: { resetToken: token, resetTokenExp: { gt: new Date() } },
    });
    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL}/reset-failed`);
    }

    // Redirect to frontend reset form
    res.redirect(`${process.env.FRONTEND_URL}/reset-password?token=${token}`);
  } catch (err) {
    logError("Error validating reset token", err);
    res.redirect(`${process.env.FRONTEND_URL}/reset-failed`);
  }
});

// ========================
// ✅ Reset Password
// ========================
router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const user = await prisma.user.findFirst({
      where: { resetToken: token, resetTokenExp: { gt: new Date() } },
    });
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExp: null,
        tokenVersion: { increment: 1 },
      },
    });

    res.json({ message: "Password reset successful. Please log in." });
  } catch (err) {
    logError("Error resetting password", err);
    res.status(500).json({ message: "Error resetting password", error: err.message });
  }
});

// ========================
// ✅ Logout
// ========================
router.post("/logout", (req, res) => {
  const token = req.cookies?.token;

  if (token) {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    info("User logged out successfully");
  }

  res.json({ message: "Logged out successfully" });
});

// ========================
// ✅ Check Authentication
// ========================
router.get("/check-auth", async (req, res) => {
  try {
    const token = req.cookies?.token || req.headers["authorization"]?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
      if (err) return res.status(401).json({ message: "Invalid token" });

      const user = await prisma.user.findUnique({ where: { id: decoded.id } });
      if (!user) return res.status(401).json({ message: "User not found" });

      if (user.status === "paused" || user.status === "disabled") {
        return res.status(403).json({ message: `Your account is ${user.status}` });
      }

      if (decoded.tokenVersion !== user.tokenVersion) {
        return res.status(401).json({ message: "Token has been invalidated. Please log in again." });
      }

      res.json({
        authenticated: true,
        user: { id: user.id, name: user.name, role: user.role, status: user.status },
      });
    });
  } catch (err) {
    logError("Error checking authentication", err);
    res.status(500).json({ message: "Error checking authentication", error: err.message });
  }
});

export default router;
