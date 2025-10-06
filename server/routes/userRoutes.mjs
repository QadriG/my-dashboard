import express from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middleware/authMiddleware.mjs";
import { errorHandler } from "../middleware/errorHandler.mjs";
import { info, error as logError } from "../utils/logger.mjs";
import ccxt from "ccxt";
import { encrypt } from "../utils/apiencrypt.mjs";

const router = express.Router();
const prisma = new PrismaClient();

/**
 * ======================
 * API Keys CRUD
 * ======================
 */

// List all API keys for the logged-in user
router.get("/apis", authMiddleware, async (req, res, next) => {
  try {
    const apis = await prisma.userAPI.findMany({ where: { userId: req.user.id } });
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

    // Validate with CCXT
    try {
      const exchangeClass = ccxt[exchangeName];
      if (!exchangeClass) return res.status(400).json({ success: false, message: "Unsupported exchange" });

      const exchange = new exchangeClass({ apiKey, secret: apiSecret, enableRateLimit: true });
      await exchange.fetchBalance();
    } catch (validationErr) {
      logError(`Invalid API key for exchange ${exchangeName}`, validationErr);
      return res.status(400).json({ success: false, message: "Invalid API key or secret" });
    }

    const encryptedKey = encrypt(apiKey);
    const encryptedSecret = encrypt(apiSecret);

    const api = await prisma.userAPI.create({
      data: { userId: req.user.id, exchangeName, apiKey: encryptedKey, apiSecret: encryptedSecret, spotEnabled: spotEnabled || false, futuresEnabled: futuresEnabled || false },
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
    await prisma.userAPI.delete({ where: { id } });
    info(`User ${req.user.id} removed API key ID: ${id}`);
    res.json({ success: true, message: "API key deleted" });
  } catch (err) {
    logError(`Error deleting API key ${req.params.id} for user ${req.user?.id}`, err);
    next(err);
  }
});

/**
 * ======================
 * User Balances
 * ======================
 */
router.get("/balances", authMiddleware, async (req, res) => {
  try {
    const apis = await prisma.userAPI.findMany({ where: { userId: req.user.id } });
    const balances = [];

    for (const api of apis) {
      try {
        const exchangeClass = ccxt[api.exchangeName];
        const exchange = new exchangeClass({
          apiKey: encrypt.decrypt(api.apiKey),
          secret: encrypt.decrypt(api.apiSecret),
          enableRateLimit: true,
        });
        const balance = await exchange.fetchBalance();
        balances.push({ exchange: api.exchangeName, balance });
      } catch (err) {
        logError(`Failed to fetch balance for ${api.exchangeName}`, err);
        balances.push({ exchange: api.exchangeName, balance: null, error: "Failed to fetch" });
      }
    }

    res.json({ success: true, balances });
  } catch (err) {
    logError(`Error fetching balances for user ${req.user.id}`, err);
    res.status(500).json({ success: false, message: "Error fetching balances" });
  }
});

/**
 * ======================
 * User Positions (Spot & Futures)
 * ======================
 */
router.get("/positions", authMiddleware, async (req, res) => {
  try {
    const apis = await prisma.userAPI.findMany({ where: { userId: req.user.id } });
    const positions = [];

    for (const api of apis) {
      try {
        const exchangeClass = ccxt[api.exchangeName];
        const exchange = new exchangeClass({
          apiKey: encrypt.decrypt(api.apiKey),
          secret: encrypt.decrypt(api.apiSecret),
          enableRateLimit: true,
        });

        // Fetch open positions (futures if supported)
        let openPositions = [];
        if (exchange.has["fetchPositions"]) {
          openPositions = await exchange.fetchPositions();
        }

        positions.push({ exchange: api.exchangeName, positions: openPositions });
      } catch (err) {
        logError(`Failed to fetch positions for ${api.exchangeName}`, err);
        positions.push({ exchange: api.exchangeName, positions: null, error: "Failed to fetch" });
      }
    }

    res.json({ success: true, positions });
  } catch (err) {
    logError(`Error fetching positions for user ${req.user.id}`, err);
    res.status(500).json({ success: false, message: "Error fetching positions" });
  }
});

/**
 * ======================
 * Dashboard Summary
 * ======================
 */
router.get("/dashboard", authMiddleware, async (req, res) => {
  try {
    const apis = await prisma.userAPI.findMany({ where: { userId: req.user.id } });
    const dashboard = { balances: [], positions: [] };

    for (const api of apis) {
      try {
        const exchangeClass = ccxt[api.exchangeName];
        const exchange = new exchangeClass({
          apiKey: encrypt.decrypt(api.apiKey),
          secret: encrypt.decrypt(api.apiSecret),
          enableRateLimit: true,
        });

        const balance = await exchange.fetchBalance();
        let openPositions = [];
        if (exchange.has["fetchPositions"]) {
          openPositions = await exchange.fetchPositions();
        }

        dashboard.balances.push({ exchange: api.exchangeName, balance });
        dashboard.positions.push({ exchange: api.exchangeName, positions: openPositions });
      } catch (err) {
        logError(`Failed to fetch dashboard data for ${api.exchangeName}`, err);
        dashboard.balances.push({ exchange: api.exchangeName, balance: null, error: "Failed to fetch" });
        dashboard.positions.push({ exchange: api.exchangeName, positions: null, error: "Failed to fetch" });
      }
    }

    res.json({ success: true, dashboard });
  } catch (err) {
    logError(`Error fetching dashboard for user ${req.user.id}`, err);
    res.status(500).json({ success: false, message: "Error fetching dashboard" });
  }
});

/**
 * ======================
 * Centralized Error Handler
 * ======================
 */
router.use(errorHandler);

export default router;
