// routes/logs.mjs
import express from "express";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;

import { isAdmin } from "../middleware/auth.mjs"; // ✅ Admin-only check

const prisma = new PrismaClient();
const router = express.Router();

/**
 * GET /api/logs
 * Fetch last 200 logs with user info
 * Admin-only
 */
router.get("/", isAdmin, async (req, res) => {
  try {
    const logs = await prisma.log.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
    });

    res.json(
      logs.map((log) => ({
        id: log.id,
        userId: log.userId,
        userEmail: log.user?.email || "N/A",
        userName: log.user?.name || "",
        tvId: log.tvId,
        exchange: log.exchange,
        symbol: log.symbol,
        request: log.request,
        message: log.message,
        level: log.level,
        createdAt: log.createdAt,
      }))
    );
  } catch (err) {
    console.error("❌ Failed to fetch logs:", err);
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});

/**
 * POST /api/logs
 * Insert new log entry
 * Expected body: { userId, tvId, exchange, symbol, request, message, level }
 * Still admin-only, because logs are not user-facing
 */
router.post("/", isAdmin, async (req, res) => {
  try {
    const { userId, tvId, exchange, symbol, request, message, level } = req.body;

    const newLog = await prisma.log.create({
      data: {
        userId,
        tvId,
        exchange,
        symbol,
        request,
        message,
        level: level || "INFO",
      },
    });

    res.json(newLog);
  } catch (err) {
    console.error("❌ Failed to create log:", err);
    res.status(500).json({ error: "Failed to create log" });
  }
});

/**
 * Utility function for logging (can be imported in other services)
 * Not middleware-protected, since it's internal usage
 */
export const logEvent = async ({ userId, tvId, exchange, symbol, request, message, level = "INFO" }) => {
  try {
    await prisma.log.create({
      data: { userId, tvId, exchange, symbol, request, message, level },
    });
  } catch (err) {
    console.error("❌ Failed to save log:", err);
  }
};

export default router;
