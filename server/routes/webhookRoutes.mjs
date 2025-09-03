// webhookRoutes.mjs
import express from "express";
import { PrismaClient } from "@prisma/client";
import { broadcastToUsers } from "../services/websocketService.mjs";
import { executeTrade } from "../services/tradeExecutor.mjs";
import { info, error as logError } from "../utils/logger.mjs";

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Webhook endpoint for TradingView alerts
 * POST /api/webhook
 */
router.post("/", async (req, res) => {
  try {
    const alertData = req.body;
    const { exchange, symbol, action } = alertData;

    if (!exchange || !symbol || !action) {
      logError("Webhook missing required fields", alertData);
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
        rawPayload: JSON.stringify(alertData),
        status: "pending",
      },
    });
    info(`Alert saved for ${exchange} ${symbol} action: ${action}`);

    // Find all users with this exchange connected
    const usersWithExchange = await prisma.userExchange.findMany({
      where: { exchange },
      select: { userId: true },
    });
    const userIds = usersWithExchange.map((ue) => ue.userId);

    // Broadcast to relevant users
    broadcastToUsers(alert, userIds);
    info(`Alert broadcasted to users: ${userIds.join(", ")}`);

    // Execute trades automatically for each user
    for (const userId of userIds) {
      try {
        const amount = alertData.amount ?? 0.01;
        await executeTrade({
          userId,
          exchange,
          symbol,
          action: action.toLowerCase(),
          amount,
          price: alertData.price ?? undefined,
        });
        info(`Trade executed for user ${userId} on ${exchange} ${symbol}`);
      } catch (err) {
        logError(`Failed to execute trade for user ${userId}`, err);
      }
    }

    return res.status(200).json({
      message: "Alert received, broadcasted, and trades executed",
      alert,
      userIds,
    });
  } catch (err) {
    logError("Webhook server error", err);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
