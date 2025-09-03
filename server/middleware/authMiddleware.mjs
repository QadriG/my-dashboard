// authMiddleware.mjs
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { info, warn, error } from "../utils/logger.mjs"; // centralized logging

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

/**
 * Auth middleware to verify JWT token (supports both cookies and headers)
 */
export const authMiddleware = async (req, res, next) => {
  try {
    // Try token from cookies first (more secure)
    let token = req.cookies?.token;

    // Fallback: check Authorization header
    if (!token && req.headers.authorization) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      warn("Unauthorized access attempt: no token provided");
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    // Verify JWT
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtErr) {
      warn("JWT verification failed:", jwtErr);
      return res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
    }

    // Lookup user in DB
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user) {
      warn(`Unauthorized: User with ID ${decoded.id} not found`);
      return res.status(401).json({ error: "Unauthorized: User not found" });
    }

    req.user = user; // attach user to request
    info(`User authenticated: ID ${user.id}, email ${user.email}`);
    next();
  } catch (err) {
    error("Auth middleware error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
