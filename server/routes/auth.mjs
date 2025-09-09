// authRoutes.mjs
import express from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { hashPassword, comparePassword } from "../utils/encrypt.mjs";
import { info, error as logError } from "../utils/logger.mjs";

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

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "user", // default role
      },
    });

    info(`New user registered: ${newUser.email} (ID: ${newUser.id})`);

    res.status(201).json({
      message: "User registered successfully",
      user: { id: newUser.id, name: newUser.name, email: newUser.email },
    });
  } catch (err) {
    logError("Error registering user", err);
    res.status(500).json({ message: "Error registering user", error: err.message });
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

    // 🚨 Block paused/disabled accounts
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
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
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
    const token =
      req.cookies?.token ||
      req.headers["authorization"]?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
      if (err) return res.status(401).json({ message: "Invalid token" });

      const user = await prisma.user.findUnique({ where: { id: decoded.id } });
      if (!user) return res.status(401).json({ message: "User not found" });

      res.json({
        authenticated: true,
        user: { id: user.id, name: user.name, role: user.role },
      });
    });
  } catch (err) {
    logError("Error checking authentication", err);
    res.status(500).json({ message: "Error checking authentication", error: err.message });
  }
});

export default router;
