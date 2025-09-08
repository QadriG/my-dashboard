import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/positions/active
router.get("/active", async (req, res) => {
  try {
    // Count all active "positions" using AlertLog with status "pending"
    const total = await prisma.alertLog.count({
      where: { status: "pending" },
    });

    console.log("Total active positions:", total);
    res.json({ success: true, total });
  } catch (err) {
    console.error("Error fetching active positions:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
