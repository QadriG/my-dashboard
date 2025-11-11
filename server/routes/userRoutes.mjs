import express from "express";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;

import { authMiddleware } from "../middleware/authMiddleware.mjs";
import { roleMiddleware } from "../middleware/roleMiddleware.mjs";
import { errorHandler } from "../middleware/errorHandler.mjs";
import { info, warn, error as logError } from "../utils/logger.mjs"; // ✅ Import warn
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
    // Assuming fetchBalance is imported from the correct service
    const balance = await fetchBalance(apiKey, apiSecret, type);
    return true;
  } catch (err) {
    warn(`API key test failed for ${provider} with type ${type}:`, err.message); // ⚠️ WARN: API test failed
    return false;
  }
}

// Helper function to get the start of the week (Monday)
function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
  return new Date(d.setDate(diff));
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

    // Aggregate executions by date for daily PnL
    const dailyPnLMap = new Map();
    const executions = await prisma.execution.findMany({
      where: { userId, execTime: { gte: thirtyDaysAgoDate } },
      orderBy: { execTime: 'desc' }
    });

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

    // Fetch weekly snapshot data for the chart (last 4 weeks)
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28); // 4 weeks ago
    const fourWeeksAgoDate = new Date(fourWeeksAgo);
    fourWeeksAgoDate.setHours(0, 0, 0, 0);

    const weeklySnapshots = await prisma.dailyPnLSnapshot.findMany({
      where: { userId, date: { gte: fourWeeksAgoDate } },
      orderBy: { date: 'asc' }
    });

    // ✅ Aggregate daily snapshots into weekly data (by calendar week)
const weeklyDataMap = new Map();

for (const snapshot of weeklySnapshots) {
  const weekStart = getStartOfWeek(snapshot.date);
  const weekKey = weekStart.toISOString().split('T')[0]; // YYYY-MM-DD format

  // Always store the latest snapshot for this week (overwrites previous)
  weeklyDataMap.set(weekKey, {
    date: weekStart,
    balance: snapshot.totalBalance, // ✅ Use the balance from the current day
  });
}

    // Convert map to array and sort by date
    const weeklyRevenue = Array.from(weeklyDataMap.values())
      .sort((a, b) => a.date - b.date)
      .map(item => ({
        date: item.date.toISOString().split('T')[0], // Format date as YYYY-MM-DD
        balance: item.balance // Use the sum of daily balances for the week
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
        weeklyRevenue, // Now aggregated by week (last 4 weeks)
        bestTradingPairs: [],
      },
      apiStatus,
      apiNames: apiNames.join(", ") || "-"
    });
  } catch (err) {
    logError(`Error fetching dashboard data for user ${req.user?.id}`, err); // ❌ ERROR: Dashboard fetch failed
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

    // Fetch full dashboard data for the user
    const dashboardData = await fetchUserExchangeData(userId);

    // Extract positions from dashboard data
    const positions = dashboardData.flatMap(d => d.openPositions || []);

    res.json({ success: true, positions });
  } catch (err) {
    logError(`Admin ${req.user.id} failed to fetch positions for user ${req.params.id}`, err); // ❌ ERROR: Positions fetch failed
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ NEW Route: Get the most recent trade for a specific user (admin only)
router.get('/:id/last-trade', authMiddleware, adminOnly, async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    const lastTrade = await prisma.trade.findFirst({
      where: { userId },
      orderBy: { tradeTime: 'desc' },
    });

    res.json({ 
      success: true, 
      trade: lastTrade 
    });
  } catch (err) {
    logError(`Admin ${req.user.id} failed to fetch last trade for user ${req.params.id}`, err); // ❌ ERROR: Last trade fetch failed
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ Route: Individual user's dashboard data (for admin to view specific user)
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
// Fetch weekly snapshot data for the chart (last 4 weeks)
const fourWeeksAgo = new Date();
fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28); // 4 weeks ago
const fourWeeksAgoDate = new Date(fourWeeksAgo);
fourWeeksAgoDate.setHours(0, 0, 0, 0);

const weeklySnapshots = await prisma.dailyPnLSnapshot.findMany({
  where: { userId, date: { gte: fourWeeksAgoDate } },
  orderBy: { date: 'asc' }
});

// ✅ Aggregate daily snapshots into weekly data (by calendar week) - Store only the last day's balance
const weeklyDataMap = new Map();

for (const snapshot of weeklySnapshots) {
  const weekStart = getStartOfWeek(snapshot.date);
  const weekKey = weekStart.toISOString().split('T')[0]; // YYYY-MM-DD format

  // Always store the latest snapshot for this week
  weeklyDataMap.set(weekKey, {
    date: weekStart,
    balance: snapshot.totalBalance, // ✅ Use the balance from the current day
  });
}

// Convert map to array and sort by date
const weeklyRevenue = Array.from(weeklyDataMap.values())
  .sort((a, b) => a.date - b.date)
  .map(item => ({
    date: item.date.toISOString().split('T')[0], // Format date as YYYY-MM-DD
    balance: item.balance // ✅ Use the balance from the last day of the week
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
        weeklyRevenue, // Now aggregated by week (last 4 weeks)
        bestTradingPairs: [],
      },
      apiStatus,
      apiNames: apiNames.join(", ") || "-"
    });
  } catch (err) {
    logError(`Error fetching dashboard data for user ${req.params.id} by admin ${req.user.id}`, err); // ❌ ERROR: Dashboard fetch failed
    res.status(500).json({ success: false, message: err.message });
  }
});

// Centralized Error Handler
router.use(errorHandler);

export default router;