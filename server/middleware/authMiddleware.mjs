// authMiddleware.mjs
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { info, warn, error } from "../utils/logger.mjs";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

export const authMiddleware = async (req, res, next) => {
  try {
    let token = req.cookies?.token || (req.headers.authorization?.split(" ")[1] || null);

    if (!token) {
      warn("Unauthorized access attempt: no token provided");
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtErr) {
      warn("JWT verification failed:", jwtErr);
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
      // Disabled users cannot log in
      warn(`Disabled user tried to authenticate: ${user.email}`);
      return res.status(403).json({ error: "Account disabled by admin" });
    }

    // Paused users can log in but we flag them for downstream usage
    user.isPaused = user.status === "paused";

    req.user = user; // attach user to request
    info(`User authenticated: ID ${user.id}, email ${user.email}, status ${user.status}`);
    next();

  } catch (err) {
    error("Auth middleware error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
