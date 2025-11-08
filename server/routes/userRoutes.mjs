// server/routes/userRoutes.mjs

import express from "express";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;

import { authMiddleware } from "../middleware/authMiddleware.mjs";
import { roleMiddleware } from "../middleware/roleMiddleware.mjs";
import { errorHandler } from "../middleware/errorHandler.mjs";
import { info, error as logError } from "../utils/logger.mjs";
import { fetchUserExchangeData } from "../services/exchangeDataSync.mjs";

const router = express.Router();
const prisma = new PrismaClient();

// Middleware to ensure admin role
const adminOnly = roleMiddleware(["admin"]);

// Helper: Get user's API accounts
async function getUserApis(userId, decrypt = false) {
  const accounts = await prisma.userExchangeAccount.findMany({
    where: { userId }
  });
  return accounts;
}

// Helper: Test if an API key is valid by fetching balance
async function testApiKey(apiKey, apiSecret, provider = 'bybit', type = 'UNIFIED') {
  try {
    if (provider.toLowerCase() !== 'bybit') return false;
    const balance = await fetchBalance(apiKey, apiSecret, type);
    return true;
  } catch (err) {
    console.warn(`API key test failed for ${provider} with type ${type}:`, err.message);
    return false;
  }
}

// --- Route: Individual user's dashboard data ---
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch user's exchange accounts
    const apis = await getUserApis(userId);
    const dashboardData = await fetchUserExchangeData(userId);

    const balances = dashboardData.map(d => ({
      exchange: d.exchange,
      type: d.type,
      balance: d.balance,
      error: d.error
    }));

    const positions = dashboardData.flatMap(d =>
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

    // Fetch historical data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoDate = new Date(thirtyDaysAgo);
    thirtyDaysAgoDate.setHours(0, 0, 0, 0);

    const snapshots = await prisma.dailyPnLSnapshot.findMany({
      where: { userId, date: { gte: thirtyDaysAgoDate } },
      orderBy: { date: 'asc' }
    });

    const balanceHistory = snapshots.map(s => ({
      date: s.date.toISOString().split('T')[0],
      balance: s.totalBalance
    }));

    const executions = await prisma.execution.findMany({
      where: { userId, execTime: { gte: thirtyDaysAgoDate } },
      orderBy: { execTime: 'desc' }
    });

    // Aggregate executions by date for daily PnL
    const dailyPnLMap = new Map();
    executions.forEach(exec => {
      const dateStr = new Date(exec.execTime).toISOString().split('T')[0];
      if (!dailyPnLMap.has(dateStr)) {
        dailyPnLMap.set(dateStr, 0);
      }
      dailyPnLMap.set(dateStr, dailyPnLMap.get(dateStr) + (exec.closedPnl || 0));
    });

    const dailyPnL = Array.from(dailyPnLMap, ([date, pnl]) => ({
      date,
      pnl: pnl,
      balance: 0, // Or calculate based on snapshot if needed
      pnlPercent: 0, // Or calculate if needed
      symbol: 'N/A',
      side: 'N/A',
      qty: 0
    }));

    // Fetch weekly snapshot data for the chart
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // Include today + 6 previous days
    const sevenDaysAgoDate = new Date(sevenDaysAgo);
    sevenDaysAgoDate.setHours(0, 0, 0, 0);

    const weeklySnapshots = await prisma.dailyPnLSnapshot.findMany({
      where: { userId, date: { gte: sevenDaysAgoDate } },
      orderBy: { date: 'asc' }
    });

    const weeklyRevenue = weeklySnapshots.map(snapshot => ({
      date: snapshot.date.toISOString().split('T')[0], // Format date as YYYY-MM-DD
      balance: snapshot.totalBalance // Use totalBalance from snapshot
    }));

    // Compute API status for user
    let apiStatus = "Not Connected";
    let apiNames = [];
    for (const api of apis) {
      const isValid = await testApiKey(api.apiKey, api.apiSecret, api.provider, api.type || 'UNIFIED');
      if (isValid) {
        apiStatus = "Connected";
        apiNames.push(api.provider);
      }
    }

    res.json({
      success: true,
      dashboard: {
        balances,
        positions,
        openOrders: [],
        balanceHistory,
        dailyPnL, // Now aggregated
        weeklyRevenue, // Now populated
        bestTradingPairs: [],
      },
      apiStatus,
      apiNames: apiNames.join(", ") || "-"
    });
  } catch (err) {
    logError(`Error fetching dashboard data for user ${req.user?.id}`, err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ Route: User's positions (for admin to view specific user's positions)
router.get('/:id/positions', authMiddleware, adminOnly, async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    const data = await fetchUserExchangeData(userId);
    const positions = data.flatMap(d => d.openPositions || []);

    res.json({ success: true, positions });
  } catch (err) {
    logError(`Error fetching positions for user ${req.params.id} by admin ${req.user.id}`, err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ NEW Route: Individual user's dashboard data (for admin to view specific user)
router.get('/:id/dashboard', authMiddleware, adminOnly, async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    // Fetch user's exchange accounts
    const apis = await getUserApis(userId);
    const dashboardData = await fetchUserExchangeData(userId);

    const balances = dashboardData.map(d => ({
      exchange: d.exchange,
      type: d.type,
      balance: d.balance,
      error: d.error
    }));

    const positions = dashboardData.flatMap(d =>
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

    // Fetch historical data for the specific user
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoDate = new Date(thirtyDaysAgo);
    thirtyDaysAgoDate.setHours(0, 0, 0, 0);

    const snapshots = await prisma.dailyPnLSnapshot.findMany({
      where: { userId, date: { gte: thirtyDaysAgoDate } },
      orderBy: { date: 'asc' }
    });

    const balanceHistory = snapshots.map(s => ({
      date: s.date.toISOString().split('T')[0],
      balance: s.totalBalance
    }));

    // Aggregate executions for daily PnL for the specific user
    const executions = await prisma.execution.findMany({
      where: { userId, execTime: { gte: thirtyDaysAgoDate } },
      orderBy: { execTime: 'desc' }
    });

    const dailyPnLMap = new Map();
    executions.forEach(exec => {
      const dateStr = new Date(exec.execTime).toISOString().split('T')[0];
      if (!dailyPnLMap.has(dateStr)) {
        dailyPnLMap.set(dateStr, 0);
      }
      dailyPnLMap.set(dateStr, dailyPnLMap.get(dateStr) + (exec.closedPnl || 0));
    });

    const dailyPnL = Array.from(dailyPnLMap, ([date, pnl]) => ({
      date,
      pnl: pnl,
      balance: 0, // Or calculate based on snapshot if needed
      pnlPercent: 0, // Or calculate if needed
      symbol: 'N/A',
      side: 'N/A',
      qty: 0
    }));

    // Fetch weekly data for the specific user
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const sevenDaysAgoDate = new Date(sevenDaysAgo);
    sevenDaysAgoDate.setHours(0, 0, 0, 0);

    const weeklySnapshots = await prisma.dailyPnLSnapshot.findMany({
      where: { userId, date: { gte: sevenDaysAgoDate } },
      orderBy: { date: 'asc' }
    });

    const weeklyRevenue = weeklySnapshots.map(snapshot => ({
      date: snapshot.date.toISOString().split('T')[0],
      balance: snapshot.totalBalance
    }));

    // Compute API status for the specific user
    let apiStatus = "Not Connected";
    let apiNames = [];
    for (const api of apis) {
      const isValid = await testApiKey(api.apiKey, api.apiSecret, api.provider, api.type || 'UNIFIED');
      if (isValid) {
        apiStatus = "Connected";
        apiNames.push(api.provider);
      }
    }

    res.json({
      success: true,
      dashboard: {
        balances,
        positions,
        openOrders: [],
        balanceHistory,
        dailyPnL, // Now aggregated
        weeklyRevenue, // Now populated
        bestTradingPairs: [],
      },
      apiStatus,
      apiNames: apiNames.join(", ") || "-"
    });
  } catch (err) {
    logError(`Error fetching dashboard data for user ${req.params.id} by admin ${req.user.id}`, err);
    res.status(500).json({ success: false, message: err.message });
  }
});


// Centralized Error Handler
router.use(errorHandler);

export default router;