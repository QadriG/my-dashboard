// userController.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * Add a new exchange connection for logged-in user
 */
export const addUserExchange = async (req, res, next) => {
  try {
    const { exchange, apiKey, apiSecret } = req.body;
    if (!exchange || !apiKey || !apiSecret) {
      return res
        .status(400)
        .json({ success: false, message: "Exchange, API key, and secret are required" });
    }

    // Prevent duplicates
    const existing = await prisma.userExchange.findFirst({
      where: { userId: req.user.id, exchange },
    });
    if (existing) {
      return res.status(400).json({ success: false, message: "Exchange already connected" });
    }

    const newExchange = await prisma.userExchange.create({
      data: { userId: req.user.id, exchange, apiKey, apiSecret },
    });

    return res
      .status(201)
      .json({ success: true, message: "Exchange added", exchange: newExchange });
  } catch (err) {
    next(err);
  }
};

/**
 * Remove a user's exchange connection
 */
export const removeUserExchange = async (req, res, next) => {
  try {
    const { id } = req.params;

    const exchange = await prisma.userExchange.findUnique({
      where: { id: Number(id) },
    });

    if (!exchange || exchange.userId !== req.user.id) {
      return res.status(404).json({ success: false, message: "Exchange not found" });
    }

    await prisma.userExchange.delete({ where: { id: Number(id) } });
    return res.json({ success: true, message: "Exchange removed" });
  } catch (err) {
    next(err);
  }
};
