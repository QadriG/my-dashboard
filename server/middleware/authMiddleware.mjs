// server/middleware/authMiddleware.mjs
import jwt from "jsonwebtoken";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;

import { info, warn, error } from "../utils/logger.mjs";
import { logEvent } from "../utils/logger.mjs"; // ✅ Import logEvent for logging

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

export const authMiddleware = async (req, res, next) => {
  try {
    let token = req.cookies?.token || (req.headers.authorization?.split(" ")[1] || null);
    console.log("Auth middleware received token:", token); // Enhanced debug
    if (!token) {
      warn("Unauthorized access attempt: no token provided");
      
      // 🔸 Log unauthorized access attempt
      await logEvent({
        message: `❌ Unauthorized access attempt: no token provided for ${req.method} ${req.path}`,
        level: "WARN",
      });
      
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtErr) {
      warn(`JWT verification failed: ${jwtErr.message}`);
      
      // 🔸 Log JWT verification failure
      await logEvent({
        message: `❌ JWT verification failed for token: ${jwtErr.message}`,
        level: "WARN",
      });
      
      return res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
    }

    // Fetch user from DB
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
      warn(`Unauthorized: User with ID ${decoded.id} not found`);
      
      // 🔸 Log user not found error
      await logEvent({
        message: `❌ Unauthorized: User with ID ${decoded.id} not found`,
        level: "WARN",
      });
      
      return res.status(401).json({ error: "Unauthorized: User not found" });
    }

    // =========================
    // STATUS ENFORCEMENT LOGIC
    // =========================

    if (user.status === "disabled") {
      warn(`Disabled user tried to authenticate: ${user.email}`);
      
      // 🔸 Log disabled user attempt
      await logEvent({
        userId: user.id, // ✅ Pass the userId here
        message: `❌ Disabled user tried to authenticate: ${user.email}`,
        level: "WARN",
      });
      
      return res.status(403).json({ error: "Account disabled by admin" });
    }

    // Clone Prisma user object to safely add extra properties
    const userWithFlags = { ...user, isPaused: user.status === "paused" };

    req.user = userWithFlags; // attach to request
    info(`User authenticated: ID ${user.id}, email ${user.email}, status ${user.status}`);
    
    // 🔸 Log successful authentication
    await logEvent({
      userId: user.id, // ✅ Pass the userId here
      message: `✅ User authenticated: ID ${user.id}, email ${user.email}, status ${user.status}`,
      level: "INFO",
    });
    
    next();
  } catch (err) {
    error(`Auth middleware error: ${err.message}`);
    
    // 🔸 Log auth middleware error
    await logEvent({
      message: `❌ Auth middleware error: ${err.message}`,
      level: "ERROR",
    });
    
    return res.status(500).json({ error: "Internal server error" });
  }
};

// middleware/auth.mjs
// Admin-only access
export const isAdmin = (req, res, next) => {
  try {
    // req.user should be populated from JWT
    if (!req.user || (req.user.role !== "admin" && req.user.role !== "ADMIN")) {
      // 🔸 Log admin access denial
      const userId = req.user?.id || "unknown";
      logEvent({
        userId: userId, // ✅ Pass the userId here
        message: `❌ Access denied: Admin access attempted by user ${userId} with role ${req.user?.role || "none"}`,
        level: "WARN",
      });
      
      return res.status(403).json({ error: "Access denied: Admins only" });
    }
    
    // Block paused or disabled admins (optional)
    if (req.user.status === "paused" || req.user.status === "disabled") {
      // 🔸 Log admin status block
      logEvent({
        userId: req.user.id, // ✅ Pass the userId here
        message: `❌ Admin access denied: Account ${req.user.email} is ${req.user.status}`,
        level: "WARN",
      });
      
      return res.status(403).json({ error: `Access denied: Your account is ${req.user.status}` });
    }
    
    next();
  } catch (err) {
    console.error("❌ Auth middleware error:", err);
    
    // 🔸 Log auth middleware error
    logEvent({
      message: `❌ Admin middleware error: ${err.message}`,
      level: "ERROR",
    });
    
    res.status(401).json({ error: "Unauthorized" });
  }
};

// General access for all logged-in users
export const isAuthenticated = (req, res, next) => {
  try {
    if (!req.user) {
      // 🔸 Log unauthenticated access attempt
      logEvent({
        message: `❌ Unauthenticated access attempt to protected route: ${req.method} ${req.path}`,
        level: "WARN",
      });
      
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    // Block paused or disabled users
    if (req.user.status === "paused" || req.user.status === "disabled") {
      // 🔸 Log user status block
      logEvent({
        userId: req.user.id, // ✅ Pass the userId here
        message: `❌ Access denied: User ${req.user.email} is ${req.user.status}`,
        level: "WARN",
      });
      
      return res.status(403).json({ error: `Access denied: Your account is ${req.user.status}` });
    }
    
    next();
  } catch (err) {
    console.error("❌ Auth middleware error:", err);
    
    // 🔸 Log auth middleware error
    logEvent({
      message: `❌ Auth middleware error: ${err.message}`,
      level: "ERROR",
    });
    
    res.status(401).json({ error: "Unauthorized" });
  }
};