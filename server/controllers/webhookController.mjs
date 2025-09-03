// alertController.mjs
import { PrismaClient } from "@prisma/client";
import { broadcastToUsers } from "../services/websocketService.mjs";
import { info, warn, error } from "../utils/logger.mjs"; // centralized logging

const prisma = new PrismaClient();

/**
 * Handle incoming TradingView webhook alerts
 * @param {*} req
 * @param {*} res
 */
export const receiveAlert = async (req, res) => {
  try {
    const alert = req.body;

    // Ensure required fields exist
    if (!alert || !alert.symbol || !alert.action) {
      warn("Webhook received invalid alert: missing symbol or action");
      return res.status(400).json({ error: "Missing required fields: symbol or action" });
    }

    // Extract fields with fallback
    const symbol = alert.symbol;
    const action = alert.action; // buy / sell
    const tp = alert.tp || null; // take profit
    const sl = alert.sl || null; // stop loss
    const exchange = alert.exchange || null;
    const price = alert.price || null;
    const extra = alert.extra || null; // any additional custom data

    // Save alert to DB for logs
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

    // Broadcast alert to all connected users via WebSocket
    broadcastToUsers({
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
    });

    res.json({ message: "Alert received, verified, and broadcasted" });
  } catch (err) {
    error("Webhook receiveAlert error:", err);

    try {
      // Log error to DB
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
