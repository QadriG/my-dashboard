import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

router.get("/active", async (req, res) => {
  try {
    const total = await prisma.user.count({ where: { isVerified: true } });
    console.log("Total active users:", total); // server log
    res.json({ success: true, total });
  } catch (err) {
    console.error("Error fetching active users:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
