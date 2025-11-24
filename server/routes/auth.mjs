// server/routes/auth.mjs
import express from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;

import crypto from "crypto";
import { encryptPassword, comparePassword } from "../utils/encrypt.mjs";
import { info, error as logError } from "../utils/logger.mjs";
import { sendEmail } from "../../src/utils/mailer.js";

dotenv.config();

const router = express.Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";
const JWT_EXPIRES_IN = "7d"; // 7 days
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

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

    const hashedPassword = await encryptPassword(password);
    const role = email === "info@tradingmachine.ai" ? "admin" : "user";

    // Create user with isVerified: false initially
    const newUser = await prisma.user.create({
      data: {  // ← Added 'data:' here
        name,
        email,
        password: hashedPassword,
        role,
        isVerified: false,
        tokenVersion: 1
      },
    });

    // Generate JWT verification token
    const verifyToken = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: "1d" });
    
    // Update user to store the verification token
    await prisma.user.update({
      where: { id: newUser.id },
      data: { verificationToken: verifyToken }  // ← Added 'data:' here
    });

    // Send verification email
    const verifyLink = `${CLIENT_URL}/verify-email?token=${encodeURIComponent(verifyToken)}`;
    await sendEmail(
      newUser.email,
      "Verify your QuantumCopyTrading account",
      `<p>Hello ${name},</p>
       <p>Please verify your email by clicking below:</p>
       <p><a href="${verifyLink}" target="_blank">Verify Email</a></p>
       <p>Link expires in 24h.</p>`
    );

    info(`New user registered: ${newUser.email} (ID: ${newUser.id})`);

    res.status(201).json({
      message: "Signup successful! Check email to verify account.",
    });
  } catch (err) {
    logError("Error registering user", err);
    res.status(500).json({ message: "Error registering user", error: err.message });
  }
});

// ========================
// ✅ Verify Email (redirect) with welcome email
// ========================
router.get("/verify-email", async (req, res) => {
  const { token } = req.query;
  console.log(`[DEBUG] Verifying email with token: ${token}`);
  
  try {
    if (!token) {
      console.log(`[DEBUG] No token provided`);
      return res.status(400).send("Missing verification token");
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
      console.log(`[DEBUG] Decoded token:`, decoded);
    } catch (err) {
      console.log(`[DEBUG] JWT verification failed:`, err.message);
      return res.status(400).send("Invalid or expired verification link");
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      console.log(`[DEBUG] No user found with ID: ${decoded.userId}`);
      return res.status(400).send("User not found");
    }
    
    console.log(`[DEBUG] Found user: ${user.email}, ID: ${user.id}, isVerified: ${user.isVerified}`);

    if (user.isVerified) {
      console.log(`[DEBUG] User ${user.email} (ID: ${user.id}) is already verified.`);
      return res.send("Email already verified. You can log in.");
    }

    // Update user to mark as verified and clear the token
    const updatedUser = await prisma.user.update({
  where: { id: user.id },
  data: {
    isVerified: true,
    verificationToken: null
  }
});

    console.log(`[DEBUG] Successfully updated user ${user.id} (${user.email})`);

    // Send welcome email after successful verification
    try {
      await sendEmail(
        updatedUser.email,
        "Welcome to QuantumCopyTrading!",
        `<p>Hello ${updatedUser.name || "User"},</p>
         <p>Congratulations! Your email has been verified successfully.</p>
         <p>Welcome to QuantumCopyTrading. We're excited to have you on board!</p>
         <p>You can now log in to your account and start trading.</p>
         <p>Best regards,<br/>The QuantumCopyTrading Team</p>`
      );
      console.log(`[DEBUG] Welcome email sent to ${updatedUser.email}`);
    } catch (emailErr) {
      console.error(`[ERROR] Failed to send welcome email to ${updatedUser.email}:`, emailErr);
      // Don't fail the verification if email sending fails - just log the error
      logError(`Failed to send welcome email to ${updatedUser.email}`, emailErr);
    }

    // Redirect to login page with success message
    res.redirect(`${CLIENT_URL}/login?verified=success`);

  }
   catch (err) {
    console.error(`[ERROR] Error verifying email for token ${token}:`, err);
    logError("Error verifying email", err);
    return res.status(500).send("Server error verifying email");
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
      return res.status(403).json({ message: "Email not verified" });
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
      user: { 
        id: user.id, 
        email: user.email, 
        role: user.role, 
        status: user.status, 
        isVerified: user.isVerified 
      },
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
      return res.status(400).json({ message: "Email not found" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExp = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await prisma.user.update({
      where: { email },
      data: { resetToken, resetTokenExp: resetExp },  // ← Added 'data:' here
    });

    const resetLink = `${CLIENT_URL}/my-dashboard/reset-password/${resetToken}`;
    await sendEmail(
      email,
      "Reset your QuantumCopyTrading password",
      `<p>Hello ${user.name || "User"},</p>
       <p>Click below to reset your password:</p>
       <a href="${resetLink}" target="_blank">Reset Password</a>
       <p>Link expires in 15 min.</p>`
    );

    res.json({ message: "Password reset email sent" });
  } catch (err) {
    logError("Error sending reset link", err);
    res.status(500).json({ message: "Error sending reset link", error: err.message });
  }
});

// ========================
// ✅ Reset Password
// ========================
router.post("/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  
  try {
    const user = await prisma.user.findFirst({
      where: { resetToken: token, resetTokenExp: { gt: new Date() } },
    });
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const hashedPassword = await encryptPassword(password);

    await prisma.user.update({
      where: { id: user.id },
      data: {  // ← Added 'data:' here
        password: hashedPassword,
        resetToken: null,
        resetTokenExp: null,
      },
    });

    res.json({ message: "Password reset successful" });
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
      path: "/",
      expires: new Date(0),
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

    // Fixed: Added proper callback function
    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: "Invalid token" });
      }

      try {
        const user = await prisma.user.findUnique({ where: { id: decoded.id } });
        if (!user) {
          return res.status(401).json({ message: "User not found" });
        }

        if (user.status === "paused" || user.status === "disabled") {
          return res.status(403).json({ message: `Your account is ${user.status}` });
        }

        if (decoded.tokenVersion !== user.tokenVersion) {
          return res.status(401).json({ message: "Token has been invalidated. Please log in again." });
        }

        res.json({
          id: user.id,
          email: user.email,
          role: user.role,
          status: user.status,
          isVerified: user.isVerified,
        });
      } catch (dbErr) {
        logError("Error fetching user during auth check", dbErr);
        res.status(500).json({ message: "Error checking authentication", error: dbErr.message });
      }
    });
  } catch (err) {
    logError("Error checking authentication", err);
    res.status(500).json({ message: "Error checking authentication", error: err.message });
  }
});

export default router;