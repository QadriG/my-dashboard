import express from "express";
import { PrismaClient } from "@prisma/client";
import { broadcastToUsers } from "../services/websocketService.js";
import { executeTrade } from "../services/tradeExecuters.js"; // <-- added

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Webhook endpoint for TradingView alerts
 * POST /api/webhook
 * Example payload:
 * {
 *   "exchange": "Binance",
 *   "symbol": "BTCUSDT",
 *   "action": "buy",
 *   "price": 30000,
 *   "tp": 31000,
 *   "sl": 29000,
 *   "extra": {...}
 * }
 */
router.post("/", async (req, res) => {
  try {
    const alertData = req.body;
    const { exchange, symbol, action } = alertData;

    if (!exchange || !symbol || !action) {
      return res.status(400).json({ message: "Missing required fields: exchange, symbol, or action" });
    }

    // Save alert to database logs
    const alert = await prisma.alertLog.create({
      data: {
        exchange,
        symbol,
        action: action.toLowerCase(),
        tp: alertData.tp ?? null,
        sl: alertData.sl ?? null,
        price: alertData.price ?? null,
        rawPayload: alertData,
        status: "pending",
      },
    });

    // Find all users who have a connected account for this exchange
    const usersWithExchange = await prisma.userExchange.findMany({
      where: { exchange: exchange },
      select: { userId: true },
    });

    const userIds = usersWithExchange.map((ue) => ue.userId);

    // Broadcast only to relevant users
    broadcastToUsers(alert, userIds);

    // Execute trades automatically for each user (optional, per user settings)
    for (const userId of userIds) {
      try {
        const amount = alertData.amount ?? 0.01; // default trade amount if not specified
        await executeTrade({
          userId,
          exchange,
          symbol,
          action: action.toLowerCase(),
          amount,
          price: alertData.price ?? undefined, // optional limit price
        });
      } catch (err) {
        console.error(`Failed to execute trade for user ${userId}:`, err);
      }
    }

    return res.status(200).json({ message: "Alert received, broadcasted, and trades executed", alert, userIds });
  } catch (err) {
    console.error("Webhook error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
