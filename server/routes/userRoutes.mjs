// server/routes/userroutes.mjs

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

// Helper: get user APIs (needed for /apis route)
async function getUserApis(userId, decrypt = false) {
  // You may already have this elsewhere — placeholder
  return [];
}

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

    // CCXT logic removed per your preference — assume handled elsewhere
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
 * User Dashboard Data
 * ======================
 */
router.get("/dashboard", authMiddleware, async (req, res) => {
  try {
    const data = await fetchUserExchangeData(req.user.id);

    const balances = data.map(d => ({
      exchange: d.exchange,
      type: d.type,
      balance: d.balance,
      error: d.error
    }));

    const positions = data.flatMap(d =>
      (d.openPositions || []).map(p => ({
        exchange: d.exchange,
        type: d.type,
        symbol: p.symbol,
        side: p.side,
        size: p.size || p.amount || 0,
        entryPrice: p.entryPrice || p.openPrice || 0,
        unrealizedPnl: p.unrealizedPnl || 0,
        openDate: p.openDate,
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

    // --- Fetch Historical Snapshots (for balance continuity) ---
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoDate = new Date(thirtyDaysAgo);
    thirtyDaysAgoDate.setHours(0, 0, 0, 0);

    const dailyPnLSnapshots = await prisma.dailyPnLSnapshot.findMany({
      where: {
        userId: req.user.id,
        date: {
          gte: thirtyDaysAgoDate,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    const balanceHistory = dailyPnLSnapshots.map(snapshot => ({
      date: snapshot.date.toISOString().split('T')[0],
      balance: snapshot.totalBalance,
    }));

    // --- Fetch RAW EXECUTIONS (for per-trade PnL) ---
    // Note: You must create a new `Execution` model in Prisma (see below)
    let executions = [];
    try {
      executions = await prisma.execution.findMany({
        where: {
          userId: req.user.id,
          execTime: {
            gte: thirtyDaysAgoDate,
          },
        },
        orderBy: { execTime: 'desc' },
      });
    } catch (err) {
      // Execution model may not exist yet — safe to ignore
      console.warn("Execution model not found or empty:", err.message);
    }

    // Map executions to dailyPnL format (one row per trade)
    const dailyPnL = executions.map(exec => ({
      date: new Date(exec.execTime).toISOString().split('T')[0],
      balance: exec.balanceAfter || 0, // optional: store balance after trade
      pnl: exec.closedPnl || 0,
      pnlPercent: 0, // enhance later if needed
      symbol: exec.symbol,
      side: exec.side,
      qty: exec.qty,
    }));

    // If no executions, fall back to snapshot-based PnL (baseline)
    if (dailyPnL.length === 0) {
      dailyPnL.push(
        ...dailyPnLSnapshots.map(snapshot => ({
          date: snapshot.date.toISOString().split('T')[0],
          balance: snapshot.totalBalance || 0,
          pnl: snapshot.totalRealizedPnl || 0,
          pnlPercent: 0,
        }))
      );
    }

    // Weekly revenue (from snapshots)
    const weeklyRevenue = {};
    dailyPnLSnapshots.forEach(snapshot => {
      const date = new Date(snapshot.date);
      const monday = new Date(date);
      monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
      const weekKey = monday.toISOString().split('T')[0];
      weeklyRevenue[weekKey] = snapshot.totalBalance;
    });

    const weeklyRevenueArray = Object.entries(weeklyRevenue).map(([date, balance]) => ({
      date,
      balance
    })).sort((a, b) => new Date(a.date) - new Date(b.date));

    const bestTradingPairs = [];

    const lastUpdated = new Date().toISOString().split('T')[0];

    res.json({
      success: true,
      dashboard: {
        balances,
        positions,
        openOrders,
        balanceHistory,
        dailyPnL,
        weeklyRevenue: weeklyRevenueArray,
        bestTradingPairs,
        lastUpdated,
      },
    });
  } catch (err) {
    logError(`Error fetching dashboard data for user ${req.user?.id}`, err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.use(errorHandler);
export default router;