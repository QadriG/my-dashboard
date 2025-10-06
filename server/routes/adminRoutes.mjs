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
import ccxt from "ccxt";
import { encrypt } from "../utils/apiencrypt.mjs";

const router = express.Router();
const prisma = new PrismaClient();

/**
 * ======================
 * Admin User Management Routes
 * ======================
 */
router.get("/users", authMiddleware, roleMiddleware(["admin"]), (req, res, next) => {
  info(`Admin ${req.user.id} accessed all users`);
  listAllUsers(req, res, next);
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
 * Admin: User API Keys, Balances, Positions
 * ======================
 */

// Fetch a user's API keys
router.get("/users/:id/apis", authMiddleware, roleMiddleware(["admin"]), async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const apis = await prisma.userAPI.findMany({ where: { userId } });
    const decryptedApis = apis.map(api => ({
      ...api,
      apiKey: encrypt.decrypt(api.apiKey),
      apiSecret: encrypt.decrypt(api.apiSecret),
    }));
    res.json({ success: true, apis: decryptedApis });
  } catch (err) {
    logError(`Admin failed to fetch API keys for user ${req.params.id}`, err);
    res.status(500).json({ success: false, message: "Error fetching API keys" });
  }
});

// Fetch a user's balances
router.get("/users/:id/balances", authMiddleware, roleMiddleware(["admin"]), async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const apis = await prisma.userAPI.findMany({ where: { userId } });
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
    logError(`Admin failed to fetch balances for user ${req.params.id}`, err);
    res.status(500).json({ success: false, message: "Error fetching balances" });
  }
});

// Fetch a user's positions
router.get("/users/:id/positions-ccxt", authMiddleware, roleMiddleware(["admin"]), async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const apis = await prisma.userAPI.findMany({ where: { userId } });
    const positions = [];

    for (const api of apis) {
      try {
        const exchangeClass = ccxt[api.exchangeName];
        const exchange = new exchangeClass({
          apiKey: encrypt.decrypt(api.apiKey),
          secret: encrypt.decrypt(api.apiSecret),
          enableRateLimit: true,
        });
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
    logError(`Admin failed to fetch positions for user ${req.params.id}`, err);
    res.status(500).json({ success: false, message: "Error fetching positions" });
  }
});

// Admin dashboard summary for a user
router.get("/users/:id/dashboard", authMiddleware, roleMiddleware(["admin"]), async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const apis = await prisma.userAPI.findMany({ where: { userId } });
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
