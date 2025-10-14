import express from "express";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;

import { authMiddleware } from "./middlewares.mjs"; // keep adminMiddleware if you want to protect admin-only

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/balances/total
router.get("/total", authMiddleware, async (req, res) => {
  try {
    const onlyAdmin = req.query.admin === "true";

    // Fetch users
    let users;
    if (onlyAdmin) {
      users = await prisma.user.findMany({ where: { role: "admin" } });
    } else {
      users = await prisma.user.findMany();
    }

    // Fetch balances from DB + exchange APIs
    let total = 0;

    for (const u of users) {
      let dbBalance = u.balance || 0;

      // try to get balance from exchange API (Bitunix, Binance, etc.)
      let exchangeBalance = 0;
      try {
        const exchangeData = await fetchUserExchangeData(u.id);
        if (exchangeData?.totalBalance) {
          exchangeBalance = exchangeData.totalBalance;
        }
      } catch (err) {
        console.warn(`Could not fetch exchange balance for user ${u.id}:`, err.message);
      }

      total += dbBalance + exchangeBalance;
    }

    res.json({ success: true, total });
  } catch (err) {
    console.error("Error fetching total balance:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
