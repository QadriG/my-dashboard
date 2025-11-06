// server/routes/adminRoutes.mjs
import axios from 'axios';
import { fetchBalance } from '../services/exchanges/bybitService.mjs';
const BASE_URL = 'https://api.bybit.com  '; // Note: trailing space removed
import express from "express";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;

import {
  listAllUsers,
  deleteUser,
  updateUserRole,
  pauseUser,
  disableUser,
  getUserStats,
  getUserPositions,
  unpauseUser,
  enableUser,
} from "../controllers/adminController.mjs";
import { authMiddleware } from "../middleware/authMiddleware.mjs";
import { roleMiddleware } from "../middleware/roleMiddleware.mjs";
import { errorHandler } from "../middleware/errorHandler.mjs";
import { info, error as logError } from "../utils/logger.mjs";
import { fetchUserExchangeData } from "../services/exchangeDataSync.mjs";

const router = express.Router();
const prisma = new PrismaClient();

// Helper: Get user's API accounts
async function getUserApis(userId, decrypt = false) {
  const accounts = await prisma.userExchangeAccount.findMany({
    where: { userId },
    select: {
      id: true,
      userId: true,
      provider: true,
      ccxtId: true,
      type: true,        // ✅ Explicitly select type
      apiKey: true,
      apiSecret: true,
      passphrase: true,
      label: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    }
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

// Middleware to ensure admin role
const adminOnly = roleMiddleware(["admin"]);

// --- Route: Aggregated user data for top 4 cards + admin-only dashboard ---
router.get('/users', authMiddleware, adminOnly, async (req, res) => {
  try {
    const users = await listAllUsers();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoDate = new Date(thirtyDaysAgo);
    thirtyDaysAgoDate.setHours(0, 0, 0, 0);

    const currentAdminId = req.user.id;

    // Fetch full dashboard data AND API accounts for each user
    const usersWithDashboard = await Promise.all(
      users.map(async (user) => {
        try {
          // ✅ Fetch user's exchange accounts
          const apis = await getUserApis(user.id);
          const dashboardData = await fetchUserExchangeData(user.id);
          return { ...user, dashboardData, apis };
        } catch (err) {
          console.warn(`Failed to fetch dashboard for user ${user.id}:`, err.message);
          return { ...user, dashboardData: [], apis: [] };
        }
      })
    );

    // --- Compute total balance (all users) ---
    let totalAllBalances = 0;
    usersWithDashboard.forEach(({ dashboardData }) => {
      if (dashboardData.length > 0) {
        dashboardData.forEach(item => {
          totalAllBalances += (item.balance?.totalBalance || 0);
        });
      }
    });

    // --- Filter data to admin-only ---
    const adminOnlyBalances = usersWithDashboard
      .flatMap(u => u.dashboardData.map(d => ({ ...d, userId: u.id })))
      .filter(acc => acc.userId === currentAdminId);

    const adminOnlyPositions = usersWithDashboard
      .flatMap(u => (u.dashboardData.flatMap(d => d.openPositions || []).map(p => ({ ...p, userId: u.id }))))
      .filter(pos => pos.userId === currentAdminId);

    const adminOnlyExecutions = await prisma.execution.findMany({
      where: { 
        userId: currentAdminId,
        execTime: { gte: thirtyDaysAgoDate } 
      },
      orderBy: { execTime: 'desc' }
    });

    const adminOnlySnapshots = await prisma.dailyPnLSnapshot.findMany({
      where: { 
        userId: currentAdminId,
        date: { gte: thirtyDaysAgoDate } 
      },
      orderBy: { date: 'asc' }
    });

    const adminTotalBalance = adminOnlyBalances.reduce((sum, acc) => sum + (acc.balance?.totalBalance || 0), 0);

    // --- Aggregated Metrics (Top 4 Cards) ---
    let totalActiveUsers = 0;
    const exchangeCounts = {};
    let totalActivePositions = 0;

    usersWithDashboard.forEach(({ dashboardData }) => {
      if (dashboardData.length > 0) {
        totalActiveUsers++;
        dashboardData.forEach(item => {
          const exchange = item.exchange || 'unknown';
          exchangeCounts[exchange] = (exchangeCounts[exchange] || 0) + 1;
          totalActivePositions += (item.openPositions?.length || 0);
        });
      }
    });

    // --- Build admin-only dashboard ---
    const adminDashboard = {
      balances: adminOnlyBalances,
      positions: adminOnlyPositions,
      openOrders: [],
      balanceHistory: adminOnlySnapshots.map(snapshot => ({
        date: snapshot.date.toISOString().split('T')[0],
        balance: snapshot.totalBalance
      })),
      dailyPnL: adminOnlyExecutions.map(exec => ({
        date: new Date(exec.execTime).toISOString().split('T')[0],
        balance: 0,
        pnl: exec.closedPnl || 0,
        pnlPercent: 0,
        symbol: exec.symbol,
        side: exec.side,
        userId: exec.userId
      })),
      weeklyRevenue: adminOnlySnapshots.map(snapshot => ({
        date: snapshot.date.toISOString().split('T')[0],
        balance: snapshot.totalBalance
      })),
      bestTradingPairs: []
    };

    // --- Enhance users list with balance + API status (for Users page) ---
    const usersWithFinalData = await Promise.all(
      usersWithDashboard.map(async (user) => {
        // 1. Compute balance data
        let totalFree = 0, totalUsed = 0, totalTotal = 0;
        if (user.dashboardData && Array.isArray(user.dashboardData)) {
          user.dashboardData.forEach(account => {
            if (account.balance) {
              totalFree += account.balance.available || 0;
              totalUsed += account.balance.used || 0;
              totalTotal += account.balance.totalBalance || 0;
            }
          });
        }

        // 2. Compute API status
        let apiStatus = "Not Connected";
        let apiNames = [];
        if (user.apis && Array.isArray(user.apis)) {
          for (const api of user.apis) {
            const isValid = await testApiKey(api.apiKey, api.apiSecret, api.provider, api.type || 'UNIFIED');
            if (isValid) {
              apiStatus = "Connected";
              apiNames.push(api.provider);
            }
          }
        }

        // 3. Return merged user object with ALL fields
        return {
          ...user,
          free: totalFree,
          used: totalUsed,
          total: totalTotal,
          apiStatus, // ✅ This will now be set correctly
          apiNames: apiNames.join(", ") || "-" // ✅ This will now be set correctly
        };
      })
    );

    res.json({
      success: true,
      aggregated: {
        activeUsers: { count: totalActiveUsers },
        activeExchange: { count: Object.keys(exchangeCounts).length, exchanges: exchangeCounts },
        activePositions: { count: totalActivePositions, totalSize: 0 },
        totalBalances: { 
          total: totalAllBalances,   // ✅ Total (all users)
          admin: adminTotalBalance   // ✅ Admin-only
        }
      },
      adminDashboard, // ✅ Only admin data
      users: usersWithFinalData // ✅ Now includes apiStatus and apiNames
    });
  } catch (err) {
    logError(`Error fetching admin dashboard data for user ${req.user?.id}`, err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- Route: All users' open positions ---
router.get('/all-positions', authMiddleware, adminOnly, async (req, res) => {
  try {
    const users = await listAllUsers();
    const allUserPositions = await Promise.all(
      users.map(async (user) => {
        try {
          const userExchangeData = await fetchUserExchangeData(user.id);
          const userOpenPositions = userExchangeData.flatMap(d => d.openPositions || []);
          return userOpenPositions.map(pos => ({ ...pos, userId: user.id, userEmail: user.email }));
        } catch (err) {
          console.error(`Error fetching positions for user ${user.id}:`, err);
          return [];
        }
      })
    );
    const allOpenPositions = allUserPositions.flat();
    res.json({ success: true, positions: allOpenPositions });
  } catch (err) {
    logError(`Admin ${req.user.id} failed to fetch all users' positions`, err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- Existing Routes (Preserved) ---
router.delete("/users/:id", authMiddleware, adminOnly, (req, res) => {
  info(`Admin ${req.user.id} deleting user ${req.params.id}`);
  deleteUser(req, res);
});

router.patch("/users/:id/role", authMiddleware, adminOnly, (req, res) => {
  info(`Admin ${req.user.id} updating role for user ${req.params.id}`);
  updateUserRole(req, res);
});

router.patch("/users/:id/pause", authMiddleware, adminOnly, (req, res) => {
  info(`Admin ${req.user.id} pausing user ${req.params.id}`);
  pauseUser(req, res);
});

router.patch("/users/:id/unpause", authMiddleware, adminOnly, (req, res) => {
  info(`Admin ${req.user.id} unpausing user ${req.params.id}`);
  unpauseUser(req, res);
});

router.patch("/users/:id/disable", authMiddleware, adminOnly, (req, res) => {
  info(`Admin ${req.user.id} disabling user ${req.params.id}`);
  disableUser(req, res);
});

router.patch("/users/:id/enable", authMiddleware, adminOnly, (req, res) => {
  info(`Admin ${req.user.id} enabling user ${req.params.id}`);
  enableUser(req, res);
});

router.get("/users/:id/stats", authMiddleware, adminOnly, (req, res) => {
  info(`Admin ${req.user.id} fetching stats for user ${req.params.id}`);
  getUserStats(req, res);
});

router.get("/users/:id/positions", authMiddleware, adminOnly, (req, res) => {
  info(`Admin ${req.user.id} fetching positions for user ${req.params.id}`);
  getUserPositions(req, res);
});

// Fetch API keys for a user
router.get("/users/:id/apis", authMiddleware, adminOnly, async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const apis = await getUserApis(userId, true);
    res.json({ success: true, apis });
  } catch (err) {
    logError(`Admin failed to fetch API keys for user ${req.params.id}`, err);
    res.status(500).json({ success: false, message: "Error fetching API keys" });
  }
});

// Centralized Error Handler
router.use(errorHandler);

export default router;