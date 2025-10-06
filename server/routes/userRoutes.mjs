import express from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middleware/authMiddleware.mjs";
import { errorHandler } from "../middleware/errorHandler.mjs";
import { info, error as logError } from "../utils/logger.mjs";
import { encrypt } from "../utils/apiencrypt.mjs";
import { getUserApis, fetchBalances, fetchPositions, getDashboard } from "../services/exchangeService.mjs";

const router = express.Router();
const prisma = new PrismaClient();

/**
 * ======================
 * User API Keys CRUD
 * ======================
 */
router.get("/apis", authMiddleware, async (req, res, next) => {
  try {
    const apis = await getUserApis(req.user.id, true);
    info(`User ${req.user.id} fetched their API keys`);
    res.json({ success: true, apis });
  } catch (err) {
    logError(`Error listing API keys for user ${req.user?.id}`, err);
    next(err);
  }
});

// Save new key
router.post("/apis", authMiddleware, async (req, res, next) => {
  try {
    const { exchangeName, apiKey, apiSecret, spotEnabled, futuresEnabled } = req.body;
    if (!exchangeName || !apiKey || !apiSecret) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // Test validity with CCXT
    const exchangeClass = ccxt[exchangeName];
    if (!exchangeClass) return res.status(400).json({ success: false, message: "Unsupported exchange" });

    const exchange = new exchangeClass({ apiKey, secret: apiSecret, enableRateLimit: true });
    await exchange.fetchBalance();

    const encryptedKey = encrypt(apiKey);
    const encryptedSecret = encrypt(apiSecret);

    const api = await prisma.userAPI.create({
      data: { userId: req.user.id, exchangeName, apiKey: encryptedKey, apiSecret: encryptedSecret, spotEnabled, futuresEnabled },
    });

    info(`User ${req.user.id} added API key for ${exchangeName}`);
    res.json({ success: true, api });
  } catch (err) {
    logError(`Error saving API key for user ${req.user?.id}`, err);
    next(err);
  }
});

// Delete key
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
 * User Data
 * ======================
 */
router.get("/balances", authMiddleware, async (req, res) => {
  res.json({ success: true, balances: await fetchBalances(req.user.id) });
});

router.get("/positions", authMiddleware, async (req, res) => {
  res.json({ success: true, positions: await fetchPositions(req.user.id) });
});

router.get("/dashboard", authMiddleware, async (req, res) => {
  res.json({ success: true, dashboard: await getDashboard(req.user.id) });
});

router.get("/me/balance", authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { balance: true, email: true },
    });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, balance: user.balance, email: user.email });
  } catch (err) {
    logError(`Error fetching /me/balance for user ${req.user.id}`, err);
    res.status(500).json({ success: false, message: "Error fetching balance" });
  }
});

router.use(errorHandler);
export default router;
