import express from "express";
import { PrismaClient } from "@prisma/client";
import { BitunixClient } from "../services/bitunixClient.mjs"; 
import { encrypt } from "../utils/apiencrypt.mjs"; // assuming same encrypt util you use in userRoutes
import { info, error as logError } from "../utils/logger.mjs";

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
            // Use first API key for demo, extend later if multiple
            const api = user.APIs[0];
            const client = new BitunixClient({
              apiKey: encrypt.decrypt(api.apiKey),
              apiSecret: encrypt.decrypt(api.apiSecret),
              type: "spot",
            });

            const balanceRes = await client.fetchBalance();
            liveBalance = balanceRes?.data?.assets || balanceRes?.data || null;
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
