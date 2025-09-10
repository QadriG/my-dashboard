import { PrismaClient } from "@prisma/client";
import { info, warn, error } from "../utils/logger.mjs";

const prisma = new PrismaClient();

// ======================
// Add a new exchange connection
// ======================
export const addUserExchange = async (req, res, next) => {
  try {
    const { exchange, apiKey, apiSecret } = req.body;

    // Block paused/disabled users
    if (req.user.status === "paused" || req.user.status === "disabled") {
      warn(`User ${req.user.id} attempted to add exchange while ${req.user.status}`);
      return res.status(403).json({ success: false, message: `Cannot add exchange while ${req.user.status}` });
    }

    if (!exchange || !apiKey || !apiSecret) {
      warn(`User ${req.user.id} failed to provide all exchange details`);
      return res.status(400).json({ success: false, message: "Exchange, API key, and secret are required" });
    }

    const existing = await prisma.userExchange.findFirst({
      where: { userId: req.user.id, exchange },
    });

    if (existing) {
      warn(`User ${req.user.id} already connected to exchange ${exchange}`);
      return res.status(400).json({ success: false, message: "Exchange already connected" });
    }

    const newExchange = await prisma.userExchange.create({
      data: { userId: req.user.id, exchange, apiKey, apiSecret },
    });

    info(`User ${req.user.id} added exchange ${exchange}`);
    return res.status(201).json({ success: true, message: "Exchange added", exchange: newExchange });
  } catch (err) {
    error("addUserExchange error:", err);
    next(err);
  }
};

// ======================
// Remove a user's exchange connection
// ======================
export const removeUserExchange = async (req, res, next) => {
  try {
    // Block paused/disabled users
    if (req.user.status === "paused" || req.user.status === "disabled") {
      warn(`User ${req.user.id} attempted to remove exchange while ${req.user.status}`);
      return res.status(403).json({ success: false, message: `Cannot remove exchange while ${req.user.status}` });
    }

    const { id } = req.params;

    const exchange = await prisma.userExchange.findUnique({
      where: { id: Number(id) },
    });

    if (!exchange || exchange.userId !== req.user.id) {
      warn(`User ${req.user.id} attempted to remove invalid exchange id ${id}`);
      return res.status(404).json({ success: false, message: "Exchange not found" });
    }

    await prisma.userExchange.delete({ where: { id: Number(id) } });
    info(`User ${req.user.id} removed exchange ${exchange.exchange}`);
    return res.json({ success: true, message: "Exchange removed" });
  } catch (err) {
    error("removeUserExchange error:", err);
    next(err);
  }
};
