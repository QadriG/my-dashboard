import express from "express";
import { PrismaClient } from "@prisma/client";
import { BitunixClient } from "../services/bitunixClient.mjs"; 
import { encrypt } from "../utils/apiencrypt.mjs"; 
import { info, error as logError } from "../utils/logger.mjs";
import { fetchUserExchangeData } from "../services/exchangeDataSync.mjs"; // Add this import

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
        APIs: true, // assuming you have relation user -> userAPI
      },
    });

    const usersWithLiveBalance = await Promise.all(
      users.map(async (user) => {
        let liveBalance = null;

        try {
          if (user.APIs?.length) {
            liveBalance = await fetchUserExchangeData(user.id); // Use the imported function
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

export default router;