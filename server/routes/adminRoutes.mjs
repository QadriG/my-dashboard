// server/routes/adminRoutes.mjs

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
import { encrypt } from "../utils/apiencrypt.mjs";
import { fetchUserExchangeData } from "../services/exchangeDataSync.mjs";

const router = express.Router();
const prisma = new PrismaClient();

// Middleware to ensure admin role
const adminOnly = roleMiddleware(["admin"]);

// --- Placeholder routes to prevent 404 ---
router.get('/users/active', authMiddleware, adminOnly, async (req, res) => {
  try {
    const users = await listAllUsers();
    // Return a simple response for now
    res.json({
      success: true,
      activeUsers: users.length
    });
  } catch (err) {
    logError(`Error fetching active users for user ${req.user?.id}`, err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/users/active-users', authMiddleware, adminOnly, async (req, res) => {
  try {
    const users = await listAllUsers();
    // Return a simple response for now
    res.json({
      success: true,
      activeUsers: users.length
    });
  } catch (err) {
    logError(`Error fetching active users for user ${req.user?.id}`, err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- Route: Admin's own dashboard data ---
router.get('/dashboard', authMiddleware, adminOnly, async (req, res) => {
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
      }))
    );
    res.json({
      success: true,
      dashboard: { balances, positions }
    });
  } catch (err) {
    logError(`Error fetching admin's own dashboard data for user ${req.user?.id}`, err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- Route: Aggregated user data for top 4 cards ---
router.get('/users', authMiddleware, adminOnly, async (req, res) => {
  try {
    // Fetch all users
    const users = await listAllUsers(); // This should return an array of user objects

    // For each user, fetch their balance data from the Balance model
    const usersWithBalance = await Promise.all(
      users.map(async (user) => {
        // Fetch balance data for this user
        const balanceRecords = await prisma.balance.findMany({
          where: { userId: user.id },
          select: {
            asset: true,
            free: true,
            used: true,
            total: true
          }
        });

        // Calculate total free, used, and total for this user
        let totalFree = 0;
        let totalUsed = 0;
        let totalTotal = 0;

        balanceRecords.forEach(record => {
          totalFree += record.free;
          totalUsed += record.used;
          totalTotal += record.total;
        });

        // Fetch API keys for this user
        const apiKeys = await prisma.userExchangeAccount.findMany({
          where: { userId: user.id },
          select: {
            provider: true,
            type: true
          }
        });

        // Return user object with balance data and API keys
        return {
          ...user,
          free: totalFree,
          used: totalUsed,
          total: totalTotal,
          APIs: apiKeys // Add this field for the frontend
        };
      })
    );

    // Calculate aggregated metrics
    let totalActiveUsers = 0;
    const exchangeCounts = {};
    let totalActivePositions = 0;
    let totalSizeOfPositions = 0;
    let totalAllBalances = 0;
    const balanceBreakdown = {};

    // For each user, fetch their exchange data for position aggregation
    const usersWithExchangeData = await Promise.all(
      usersWithBalance.map(async (user) => {
        try {
          const userExchangeData = await fetchUserExchangeData(user.id);
          // Count this user if they have any exchange data
          if (userExchangeData && userExchangeData.length > 0) {
            totalActiveUsers++;
          }

          // Aggregate data for this user
          userExchangeData.forEach(item => {
            const exchange = item.exchange || 'unknown';
            exchangeCounts[exchange] = (exchangeCounts[exchange] || 0) + 1;
            const positions = item.openPositions || [];
            totalActivePositions += positions.length;
            positions.forEach(pos => {
              totalSizeOfPositions += (pos.size || 0);
            });

            const balances = item.balance?.balances || {};
            Object.entries(balances).forEach(([asset, balanceInfo]) => {
              const totalBalance = balanceInfo.total || 0;
              totalAllBalances += totalBalance;
              balanceBreakdown[asset] = (balanceBreakdown[asset] || 0) + totalBalance;
            });
          });

          return {
            ...user,
            balanceData: userExchangeData
          };
        } catch (err) {
          console.error(`Error fetching data for user ${user.id}:`, err);
          return {
            ...user,
            balanceData: [] // Return empty array if there's an error
          };
        }
      })
    );

    // Prepare the response object with the exact structure the frontend expects
    res.json({
      success: true,
      aggregated: {
        activeUsers: { count: totalActiveUsers },
        activeExchange: { count: Object.keys(exchangeCounts).length, exchanges: exchangeCounts },
        activePositions: { count: totalActivePositions, totalSize: totalSizeOfPositions },
        totalBalances: { total: totalAllBalances, breakdown: balanceBreakdown }
      },
      // Also return the full user list with balance data for other parts of the UI
      users: usersWithExchangeData
    });
  } catch (err) {
    logError(`Error fetching admin dashboard data for user ${req.user?.id}`, err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- Route: All users' open positions ---
router.get('/all-positions', authMiddleware, adminOnly, async (req, res) => {
  try {
    const users = await listAllUsers(); // Get all users
    const allUserPositions = await Promise.all(
      users.map(async (user) => {
        try {
          const userExchangeData = await fetchUserExchangeData(user.id);
          const userOpenPositions = userExchangeData.flatMap(d => d.openPositions || []);
          return userOpenPositions.map(pos => ({ ...pos, userId: user.id, userEmail: user.email }));
        } catch (err) {
          console.error(`Error fetching positions for user ${user.id}:`, err);
          return []; // Return empty array for this user if there's an error
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
  deleteUser(req, res); // No next parameter
});

router.patch("/users/:id/role", authMiddleware, adminOnly, (req, res) => {
  info(`Admin ${req.user.id} updating role for user ${req.params.id}`);
  updateUserRole(req, res); // No next parameter
});

router.patch("/users/:id/pause", authMiddleware, adminOnly, (req, res) => {
  info(`Admin ${req.user.id} pausing user ${req.params.id}`);
  pauseUser(req, res); // No next parameter
});

router.patch("/users/:id/unpause", authMiddleware, adminOnly, (req, res) => {
  info(`Admin ${req.user.id} unpausing user ${req.params.id}`);
  unpauseUser(req, res); // No next parameter
});

router.patch("/users/:id/disable", authMiddleware, adminOnly, (req, res) => {
  info(`Admin ${req.user.id} disabling user ${req.params.id}`);
  disableUser(req, res); // No next parameter
});

router.patch("/users/:id/enable", authMiddleware, adminOnly, (req, res) => {
  info(`Admin ${req.user.id} enabling user ${req.params.id}`);
  enableUser(req, res); // No next parameter
});

router.get("/users/:id/stats", authMiddleware, adminOnly, (req, res) => {
  info(`Admin ${req.user.id} fetching stats for user ${req.params.id}`);
  getUserStats(req, res); // No next parameter
});

router.get("/users/:id/positions", authMiddleware, adminOnly, (req, res) => {
  info(`Admin ${req.user.id} fetching positions for user ${req.params.id}`);
  getUserPositions(req, res); // No next parameter
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