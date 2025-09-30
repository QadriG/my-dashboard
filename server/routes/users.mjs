import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/users
router.get("/", async (req, res) => {
  try {
    // fetch all users, optionally filter verified ones
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        balance: true, // make sure 'balance' exists in your user table
        role: true,
        isVerified: true,
      },
    });

    res.json(users); // frontend expects an array
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
