import express from "express";
import { PrismaClient } from "@prisma/client";
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

router.get("/users", authMiddleware, roleMiddleware(["admin"]), async (req, res, next) => {
  info(`Admin ${req.user.id} accessed all users`);
  try {
    const users = await listAllUsers(req, res, next);
    if (users) {
      const usersWithBalance = await Promise.all(
        users.map(async (user) => ({
          ...user,
          balanceData: await fetchUserExchangeData(user.id).catch(() => []),
        }))
      );
      res.json({ success: true, users: usersWithBalance });
    }
  } catch (err) {
    logError(`Admin ${req.user.id} failed to fetch all users`, err);
    next(err);
  }
});

router.delete("/users/:id", authMiddleware, roleMiddleware(["admin"]), (req, res, next) => {
  info(`Admin ${req.user.id} deleting user ${req.params.id}`);
  deleteUser(req, res, next);
});

router.patch("/users/:id/role", authMiddleware, roleMiddleware(["admin"]), (req, res, next) => {
  info(`Admin ${req.user.id} updating role for user ${req.params.id}`);
  updateUserRole(req, res, next);
});

router.patch("/users/:id/pause", authMiddleware, roleMiddleware(["admin"]), (req, res, next) => {
  info(`Admin ${req.user.id} pausing user ${req.params.id}`);
  pauseUser(req, res, next);
});

router.patch("/users/:id/unpause", authMiddleware, roleMiddleware(["admin"]), (req, res, next) => {
  info(`Admin ${req.user.id} unpausing user ${req.params.id}`);
  unpauseUser(req, res, next);
});

router.patch("/users/:id/disable", authMiddleware, roleMiddleware(["admin"]), (req, res, next) => {
  info(`Admin ${req.user.id} disabling user ${req.params.id}`);
  disableUser(req, res, next);
});

router.patch("/users/:id/enable", authMiddleware, roleMiddleware(["admin"]), (req, res, next) => {
  info(`Admin ${req.user.id} enabling user ${req.params.id}`);
  enableUser(req, res, next);
});

router.get("/users/:id/stats", authMiddleware, roleMiddleware(["admin"]), (req, res, next) => {
  info(`Admin ${req.user.id} fetching stats for user ${req.params.id}`);
  getUserStats(req, res, next);
});

router.get("/users/:id/positions", authMiddleware, roleMiddleware(["admin"]), (req, res, next) => {
  info(`Admin ${req.user.id} fetching positions for user ${req.params.id}`);
  getUserPositions(req, res, next);
});

/**
 * ======================
 * Admin: User Exchange Data
 * ======================
 */

// Fetch API keys for a user
router.get("/users/:id/apis", authMiddleware, roleMiddleware(["admin"]), async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const apis = await getUserApis(userId, true);
    res.json({ success: true, apis });
  } catch (err) {
    logError(`Admin failed to fetch API keys for user ${req.params.id}`, err);
    res.status(500).json({ success: false, message: "Error fetching API keys" });
  }
});

// Fetch balances for a user
router.get("/users/:id/balances", authMiddleware, roleMiddleware(["admin"]), async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    res.json({ success: true, balances: await fetchBalances(userId) });
  } catch (err) {
    logError(`Admin failed to fetch balances for user ${req.params.id}`, err);
    res.status(500).json({ success: false, message: "Error fetching balances" });
  }
});

// Fetch positions for a user
router.get("/users/:id/positions-ccxt", authMiddleware, roleMiddleware(["admin"]), async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    res.json({ success: true, positions: await fetchPositions(userId) });
  } catch (err) {
    logError(`Admin failed to fetch positions for user ${req.params.id}`, err);
    res.status(500).json({ success: false, message: "Error fetching positions" });
  }
});

// Fetch dashboard summary for a user
router.get("/users/:id/dashboard", authMiddleware, roleMiddleware(["admin"]), async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    res.json({ success: true, dashboard: await getDashboard(userId) });
  } catch (err) {
    logError(`Admin failed to fetch dashboard for user ${req.params.id}`, err);
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