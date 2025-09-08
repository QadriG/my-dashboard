import express from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware, adminMiddleware } from "./middlewares.mjs"; // adjust path if needed

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/balances/total
router.get("/total", authMiddleware, async (req, res) => {
  try {
    const onlyAdmin = req.query.admin === "true";

    let users;
    if (onlyAdmin) {
      users = await prisma.user.findMany({ where: { role: "admin" } });
    } else {
      users = await prisma.user.findMany();
    }

    // If balance stored in DB (or replace with API fetch)
    const total = users.reduce((sum, u) => sum + (u.balance || 0), 0);

    res.json({ success: true, total });
  } catch (err) {
    console.error("Error fetching total balance:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
