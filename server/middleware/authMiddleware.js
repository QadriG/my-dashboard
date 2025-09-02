import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

/**
 * Auth middleware to verify JWT token (supports both cookies and headers)
 */
export const authMiddleware = async (req, res, next) => {
  try {
    // ✅ Try token from cookies first (more secure)
    let token = req.cookies?.token;

    // ✅ Fallback: check Authorization header
    if (!token && req.headers.authorization) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    // ✅ Verify JWT
    const decoded = jwt.verify(token, JWT_SECRET);

    // ✅ Lookup user in DB
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user) {
      return res.status(401).json({ error: "Unauthorized: User not found" });
    }

    req.user = user; // attach user to request
    next();
  } catch (err) {
    console.error("Auth error:", err);
    return res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
  }
};
