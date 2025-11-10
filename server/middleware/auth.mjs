import jwt from "jsonwebtoken";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;

import { info, warn, error } from "../utils/logger.mjs";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

export const authMiddleware = async (req, res, next) => {
  try {
    let token = req.cookies?.token || (req.headers.authorization?.split(" ")[1] || null);
    console.log("Auth middleware received token:", token); // Enhanced debug
    if (!token) {
      warn("Unauthorized access attempt: no token provided");
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtErr) {
      warn(`JWT verification failed: ${jwtErr.message}`);
      return res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
    }

    // Fetch user from DB
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
      warn(`Unauthorized: User with ID ${decoded.id} not found`);
      return res.status(401).json({ error: "Unauthorized: User not found" });
    }

    // =========================
    // STATUS ENFORCEMENT LOGIC
    // =========================

    if (user.status === "disabled") {
      warn(`Disabled user tried to authenticate: ${user.email}`);
      return res.status(403).json({ error: "Account disabled by admin" });
    }

    // Clone Prisma user object to safely add extra properties
    const userWithFlags = { ...user, isPaused: user.status === "paused" };

    req.user = userWithFlags; // attach to request
    info(`User authenticated: ID ${user.id}, email ${user.email}, status ${user.status}`);
    next();

  } catch (err) {
    error(`Auth middleware error: ${err.message}`);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Admin-only access
export const isAdmin = (req, res, next) => {
  try {
    // ✅ Fix: Check for lowercase "admin" role (or both for flexibility)
    if (!req.user || (req.user.role !== "admin" && req.user.role !== "ADMIN")) {
      return res.status(403).json({ error: "Access denied: Admins only" });
    }

    // Block paused or disabled admins (optional)
    if (req.user.status === "paused" || req.user.status === "disabled") {
      return res.status(403).json({ error: `Access denied: Your account is ${req.user.status}` });
    }

    next();
  } catch (err) {
    console.error("❌ Auth middleware error:", err);
    res.status(401).json({ error: "Unauthorized" });
  }
};

// General access for all logged-in users
export const isAuthenticated = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Block paused or disabled users
    if (req.user.status === "paused" || req.user.status === "disabled") {
      return res.status(403).json({ error: `Access denied: Your account is ${user.status}` });
    }

    next();
  } catch (err) {
    console.error("❌ Auth middleware error:", err);
    res.status(401).json({ error: "Unauthorized" });
  }
};