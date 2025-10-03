import express from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middleware/authMiddleware.mjs";
import { errorHandler } from "../middleware/errorHandler.mjs";
import { info, error as logError } from "../utils/logger.mjs";
import ccxt from "ccxt";
import { encrypt } from "../utils/apiencrypt.mjs";

const router = express.Router();
const prisma = new PrismaClient();

// List all API keys for the logged-in user
router.get("/apis", authMiddleware, async (req, res, next) => {
  try {
    const apis = await prisma.userAPI.findMany({
      where: { userId: req.user.id },
    });
    info(`User ${req.user.id} fetched their API keys`);
    const decryptedApis = apis.map(api => ({
      ...api,
      apiKey: encrypt.decrypt(api.apiKey),
      apiSecret: encrypt.decrypt(api.apiSecret),
    }));
    res.json({ success: true, apis: decryptedApis });
  } catch (err) {
    logError(`Error listing API keys for user ${req.user?.id}`, err);
    next(err);
  }
});

// Save a new API key with validation
router.post("/apis", authMiddleware, async (req, res, next) => {
  try {
    const { exchangeName, apiKey, apiSecret, spotEnabled, futuresEnabled } = req.body;

    if (!exchangeName || !apiKey || !apiSecret) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // ✅ Validate keys using CCXT
    try {
      const exchangeClass = ccxt[exchangeName];
      if (!exchangeClass) {
        return res.status(400).json({ success: false, message: "Unsupported exchange" });
      }

      const exchange = new exchangeClass({
        apiKey,
        secret: apiSecret,
        enableRateLimit: true,
      });

      // Ping account balance (safe, non-trading call)
      await exchange.fetchBalance();
    } catch (validationErr) {
      logError(`Invalid API key for exchange ${exchangeName}`, validationErr);
      return res.status(400).json({
        success: false,
        message: "Invalid API key or secret. Please check permissions.",
      });
    }

    // ✅ Encrypt before saving
    const encryptedKey = encrypt(apiKey);
    const encryptedSecret = encrypt(apiSecret);

    // ✅ Save in DB
    const api = await prisma.userAPI.create({
      data: {
        userId: req.user.id,
        exchangeName,
        apiKey: encryptedKey,
        apiSecret: encryptedSecret,
        spotEnabled: spotEnabled || false,
        futuresEnabled: futuresEnabled || false,
      },
    });

    info(`User ${req.user.id} added API key for ${exchangeName}`);
    res.json({ success: true, api });
  } catch (err) {
    logError(`Error saving API key for user ${req.user?.id}`, err);
    next(err);
  }
});

// Delete an API key
router.delete("/apis/:id", authMiddleware, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);

    await prisma.userAPI.delete({
      where: { id },
    });

    info(`User ${req.user.id} removed API key ID: ${id}`);
    res.json({ success: true, message: "API key deleted" });
  } catch (err) {
    logError(`Error deleting API key ${req.params.id} for user ${req.user?.id}`, err);
    next(err);
  }
});

/**
 * ======================
 * Centralized Error Handler
 * ======================
 */
router.use(errorHandler);

export default router;