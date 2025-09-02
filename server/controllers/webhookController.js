import { PrismaClient } from "@prisma/client";
import { broadcastToUsers } from "../services/websocketService.js";

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
    await prisma.tradeLog.create({
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

    // Broadcast alert to all connected users via WebSocket
    broadcastToUsers({
      symbol,
      action,
      tp,
      sl,
      exchange,
      price,
      extra,
    });

    res.json({ message: "Alert received, verified, and broadcasted" });
  } catch (err) {
    console.error("Webhook receiveAlert error:", err);

    // Log error to DB
    await prisma.errorLog.create({
      data: {
        context: "webhook",
        message: err.message || "Unknown error",
        stack: err.stack || "",
      },
    });

    res.status(500).json({ error: "Server error processing alert" });
  }
};
