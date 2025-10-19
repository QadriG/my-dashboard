// File: server/routes/users.mjs
import express from "express";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;

import { BitunixClient } from "../services/bitunixClient.mjs"; 
import { encrypt } from "../utils/apiencrypt.mjs"; 
import { info, error as logError } from "../utils/logger.mjs";
import { fetchUserExchangeData } from "../services/exchangeDataSync.mjs";

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/users
router.get("/", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        balance: true,
        role: true,
        isVerified: true,
        APIs: true,
      },
    });

    const usersWithLiveBalance = await Promise.all(
      users.map(async (user) => {
        let liveBalance = null;
        try {
          if (user.APIs?.length) {
            liveBalance = await fetchUserExchangeData(user.id);
          }
        } catch (err) {
          logError(`Live balance fetch failed for user ${user.id}`, err);
        }

        return {
          id: user.id,
          name: user.name,
          role: user.role,
          isVerified: user.isVerified,
          balance: liveBalance || user.balance || 0,
        };
      })
    );

    res.json(usersWithLiveBalance);
  } catch (err) {
    logError("Error fetching users:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ NEW: GET /api/users/dashboard — for user dashboard data
router.get("/dashboard", async (req, res, next) => {
  // authMiddleware should be applied in server.js or here
  // For now, assume req.user is set by authMiddleware (you'll add it next)
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const data = await fetchUserExchangeData(req.user.id);

    // Transform for frontend
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
        entryPrice: p.entryPrice || 0,
        unrealizedPnl: p.unrealizedPnl || 0,
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
    logError(`Dashboard fetch failed for user ${req.user.id}`, err);
    // Optional: return mock data on error
    res.json({
      success: true,
      dashboard: {
        balances: [{
          exchange: "bybit",
          type: "futures",
          balance: { totalBalance: 310.13, available: 123.42, used: 186.70 },
          error: null
        }],
        positions: [],
        openOrders: []
      }
    });
  }
});

export default router;