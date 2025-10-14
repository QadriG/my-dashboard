// alertController.mjs
import pkg from "@prisma/client";
const { PrismaClient } = pkg;

import { sendToUser } from "../services/websocketService.mjs"; // 👈 updated to per-user broadcast
import { info, warn, error } from "../utils/logger.mjs";

const prisma = new PrismaClient();

/**
 * Handle incoming TradingView webhook alerts
 */
export const receiveAlert = async (req, res) => {
  try {
    const alert = req.body;

    if (!alert || !alert.symbol || !alert.action) {
      warn("Webhook received invalid alert: missing symbol or action");
      return res.status(400).json({ error: "Missing required fields: symbol or action" });
    }

    const { symbol, action, tp = null, sl = null, exchange = null, price = null, extra = null } = alert;

    // Save alert in DB
    const savedAlert = await prisma.tradeLog.create({
      data: {
        symbol,
        action,
        price,
        tp,
        sl,
        exchange,
        rawPayload: JSON.stringify(alert),
        status: "pending",
      },
    });

    info(`Webhook alert saved: ${symbol} ${action} on ${exchange}`);

    // ✅ Fetch only ACTIVE users (exclude PAUSED & DISABLED)
    const activeUsers = await prisma.user.findMany({
      where: { status: "active" }, // must match exactly "active" in DB
      select: { id: true },
    });

    // ✅ Broadcast only to active users
    for (const user of activeUsers) {
      sendToUser(user.id, {
        type: "alert",
        data: {
          id: savedAlert.id,
          symbol,
          action,
          tp,
          sl,
          exchange,
          price,
          extra,
          status: "pending",
          rawPayload: JSON.stringify(alert),
        },
      });
    }

    res.json({ message: `Alert received and broadcasted to ${activeUsers.length} active users` });
  } catch (err) {
    error("Webhook receiveAlert error:", err);

    try {
      await prisma.errorLog.create({
        data: {
          context: "webhook",
          message: err.message || "Unknown error",
          stack: err.stack || "",
        },
      });
    } catch (dbErr) {
      error("Failed to log webhook error to DB:", dbErr);
    }

    res.status(500).json({ error: "Server error processing alert" });
  }
};
