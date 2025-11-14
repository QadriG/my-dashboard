// server/routes/closePosition.mjs
import express from "express";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;
import { authMiddleware } from "../middleware/authMiddleware.mjs";
import { roleMiddleware } from "../middleware/roleMiddleware.mjs";
import { info, warn, error as logError } from "../utils/logger.mjs";

const router = express.Router();
const prisma = new PrismaClient();

// Middleware to ensure admin role
const adminOnly = roleMiddleware(["admin"]);

// Helper function to close a position for a user
async function closePositionForUser(userId, symbol, side) {
  try {
    // Find the user's exchange account for this symbol/exchange
    const userExchange = await prisma.userExchangeAccount.findFirst({
      where: { userId },
      include: { user: true }
    });

    if (!userExchange) {
      warn(`User ${userId} has no exchange account`);
      return null;
    }

    // Assuming you have a service to close positions
    // This is a placeholder; you'll need to implement the actual logic to close the position with the exchange API
    // For example:
    // const result = await closePositionViaAPI(userExchange.apiKey, userExchange.apiSecret, symbol, side);

    // For now, simulate closing by updating the position status
    const position = await prisma.position.updateMany({
      where: {
        userId,
        symbol,
        side,
        status: 'open'
      },
      data: {
        status: 'closed',
        closePrice: 0, // You would get this from the exchange API
        realizedPnl: 0, // You would calculate this based on close price and entry price
        closeDate: new Date()
      }
    });

    if (position.count > 0) {
      info(`✅ Closed position for user ${userId}: ${symbol} ${side}`);
      return position;
    } else {
      warn(`No open position found for user ${userId}: ${symbol} ${side}`);
      return null;
    }
  } catch (err) {
    logError(`Failed to close position for user ${userId}: ${symbol} ${side}`, err);
    return null;
  }
}

// POST /api/positions/close - Close position for all users with matching symbol and side
router.post("/", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { symbol, side } = req.body;

    if (!symbol || !side) {
      return res.status(400).json({ success: false, message: "Symbol and side are required" });
    }

    // Get all users who have open positions with this symbol and side
    const usersWithPositions = await prisma.position.findMany({
      where: {
        symbol,
        side,
        status: 'open'
      },
      distinct: ['userId']
    });

    const userIds = usersWithPositions.map(p => p.userId);

    if (userIds.length === 0) {
      return res.json({ success: true, message: "No positions found to close" });
    }

    // Close the position for each user
    const results = [];
    for (const userId of userIds) {
      const result = await closePositionForUser(userId, symbol, side);
      results.push(result);
    }

    res.json({ 
      success: true, 
      message: `Closed positions for ${results.filter(r => r !== null).length} users`,
      results 
    });

  } catch (err) {
    logError("Error closing positions:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;