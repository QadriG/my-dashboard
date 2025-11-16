// server/routes/logs.mjs
import express from "express";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;
import { isAdmin } from "../middleware/auth.mjs"; // ✅ Admin-only check
const prisma = new PrismaClient();
const router = express.Router();

/**
 * Helper function to extract user ID or email from a message
 */
async function extractUserFromMessage(message) {
  if (!message) return null;

  // Try to extract user ID (e.g., "user 1", "user 2")
  const userIdMatch = message.match(/user\s+(\d+)/i);
  if (userIdMatch) {
    const userId = parseInt(userIdMatch[1]);
    if (!isNaN(userId)) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true }
      });
      if (user) {
        return user;
      }
    }
  }

  // Try to extract email address
  const emailMatch = message.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (emailMatch) {
    const email = emailMatch[1];
    const user = await prisma.user.findUnique({
      where: { email: email },
      select: { id: true, email: true, name: true }
    });
    if (user) {
      return user;
    }
  }

  return null;
}

/**
 * GET /api/logs
 * Fetch last 200 critical logs (ERROR/WARN) with enhanced user info
 * Admin-only
 */
router.get("/", isAdmin, async (req, res) => {
  try {
    // Fetch only ERROR and WARN logs with user info
    const logs = await prisma.log.findMany({
      where: {
        level: { in: ['ERROR', 'WARN'] } // ✅ Filter for critical logs only
      },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        user: { select: { id: true, email: true, name: true } }, // ✅ Include related User
      },
    });

    // Deduplicate logs based on message + level + (included) user ID + exchange + symbol
    const deduplicatedLogs = [];
    const seenKeys = new Set();

    for (const log of logs) {
      // ✅ Use log.user?.id for the key, fallback to log.userId if needed
      const userIdForDedup = log.user?.id ?? log.userId ?? 'NO_USER'; // Handle potential null user object or id

      // Create a unique key for deduplication
      const key = `${log.message}|${log.level}|${userIdForDedup}|${log.exchange}|${log.symbol}`;

      if (!seenKeys.has(key)) {
        seenKeys.add(key);

        // Extract user info from message if not already available via include
        let userEmail = log.user?.email || "N/A";
        let userName = log.user?.name || "N/A";

        // Only try to extract from message if DB join didn't yield user info and a message exists
        if (userEmail === "N/A" && log.message) {
          const extractedUser = await extractUserFromMessage(log.message);
          if (extractedUser) {
            userEmail = extractedUser.email;
            userName = extractedUser.name;
          }
        }

        // Enhance request data based on message or other context
        let request = log.request;
        if (!request && log.message) {
          // Try to extract some context from the message
          if (log.message.includes("API key test failed")) {
            request = "API Key Test Request";
          } else if (log.message.includes("Failed bybit")) {
            request = "Bybit Exchange Request";
          } else if (log.message.includes("fetching admin dashboard data")) {
            request = "Admin Dashboard Data Fetch";
          } else if (log.message.includes("listAllUsers")) {
            request = "List All Users Request";
          } else if (log.message.includes("fetching users")) {
            request = "Fetch Users Request";
          } else if (log.message.includes("fetching positions")) {
            request = "Fetch Positions Request";
          } else if (log.message.includes("Forbidden access attempt")) {
            request = "Access Attempt";
          }
        }

        // Add the log with full user info and enhanced request data
        deduplicatedLogs.push({
          ...log,
          userEmail, // Use the potentially enhanced user info
          userName, // Use the potentially enhanced user info
          request
        });
      }
    }

    // Return the deduplicated logs
    res.json({
      success: true,
      logs: deduplicatedLogs.map((log) => ({
        id: log.id,
        userId: log.userId, // Original field from DB
        userEmail: log.userEmail,
        userName: log.userName,
        tvId: log.tvId,
        exchange: log.exchange,
        symbol: log.symbol,
        request: log.request,
        message: log.message,
        level: log.level,
        createdAt: log.createdAt,
      })),
    });
  } catch (err) {
    console.error("❌ Failed to fetch logs:", err); // Keep this one for critical server errors
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});

export default router;