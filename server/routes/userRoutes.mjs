import express from "express";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;

import { authMiddleware } from "../middleware/authMiddleware.mjs";
import { errorHandler } from "../middleware/errorHandler.mjs";
import { info, error as logError } from "../utils/logger.mjs";
import { encrypt } from "../utils/apiencrypt.mjs";
import { fetchUserExchangeData } from "../services/exchangeDataSync.mjs";



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
// ✅ Unified data fetch using the working exchangeDataSync
router.get("/dashboard", authMiddleware, async (req, res) => {
  try {
    const data = await fetchUserExchangeData(req.user.id);

    const balances = data.map(d => ({
      exchange: d.exchange,
      type: d.type,
      balance: d.balance,
      error: d.error
    }));

    // ✅ FIXED: Include openDate and all relevant fields
    const positions = data.flatMap(d =>
      (d.openPositions || []).map(p => ({
        exchange: d.exchange,
        type: d.type,
        symbol: p.symbol,
        side: p.side,
        size: p.size || p.amount || 0,           // support both
        entryPrice: p.entryPrice || p.openPrice || 0,
        unrealizedPnl: p.unrealizedPnl || 0,
        openDate: p.openDate,                    // ✅ CRITICAL: include openDate
        orderValue: p.orderValue || 0,
      }))
    );

    const openOrders = data.flatMap(d =>
      (d.openOrders || []).map(o => ({
        exchange: d.exchange,
        type: d.type,
        symbol: o.symbol,
        side: o.side,
        price: o.price,
        amount: o.amount,
        status: o.status,
      }))
    );

    res.json({
      success: true,
      dashboard: {
        balances,
        positions,
        openOrders,
      },
    });
  } catch (err) {
    logError(`Error fetching dashboard data for user ${req.user?.id}`, err);
    res.status(500).json({ success: false, message: err.message });
  }
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
// Add this inside server/routes/user.mjs

router.get("/daily-pnl", authMiddleware, async (req, res) => {
  try {
    const { range = '10d' } = req.query;
    const days = range === '7d' ? 7 : range === '10d' ? 10 : 30;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const snapshots = await prisma.dailyPnLSnapshot.findMany({
      where: {
        userId: req.user.id,
        date: { gte: startDate }
      },
      orderBy: { date: 'asc' }
    });

    const pnlData = snapshots.map((snap, i) => {
      const prev = snapshots[i - 1];
      const dailyPnL = prev ? snap.totalUnrealizedPnl - prev.totalUnrealizedPnl : 0;
      return {
        date: snap.date.toISOString().split('T')[0],
        coin: 'USDT',
        balance: snap.totalBalance,
        pnl: dailyPnL,
        pnlPercent: snap.totalBalance ? ((dailyPnL / snap.totalBalance) * 100).toFixed(2) : "0.00"
      };
    });

    res.json(pnlData);
  } catch (err) {
    logError(`Error fetching daily PnL for user ${req.user?.id}`, err);
    res.status(500).json([]);
  }
});
router.use(errorHandler);
export default router;
