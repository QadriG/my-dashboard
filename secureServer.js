import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "./server/middleware/authMiddleware.mjs";
import { info, error as logError } from "./server/utils/logger.mjs";
import { encrypt } from "./server/utils/apiencrypt.mjs";
import { syncUserExchangesImmediately } from "./server/services/exchangeDataSync.mjs";

const app = express();
const prisma = new PrismaClient();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

app.post("/api/save-api-key", authMiddleware, async (req, res) => {
  try {
    const { exchange, apiKey, apiSecret, passphrase, accountType } = req.body;
    if (!exchange || !apiKey || !apiSecret) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const encryptedKey = encrypt(apiKey);
    const encryptedSecret = encrypt(apiSecret);
    const encryptedPassphrase = passphrase ? encrypt(passphrase) : null;

    await prisma.userExchange.upsert({
      where: { userId_exchange: { userId: req.user.id, exchange } },
      update: {
        apiKey: encryptedKey,
        apiSecret: encryptedSecret,
        passphrase: encryptedPassphrase,
        accountType: accountType || "spot",
      },
      create: {
        userId: req.user.id,
        exchange,
        apiKey: encryptedKey,
        apiSecret: encryptedSecret,
        passphrase: encryptedPassphrase,
        accountType: accountType || "spot",
      },
    });

    await syncUserExchangesImmediately(req.user.id);
    info(`User ${req.user.id} saved API key for ${exchange}`);
    res.json({ message: "API key saved successfully" });
  } catch (err) {
    logError(`Error saving API key for user ${req.user?.id}`, err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/exchange/user/:id/balance", authMiddleware, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (req.user.role !== "admin" && req.user.id !== userId) {
      return res.status(403).json({ success: false, error: "Unauthorized" });
    }

    const balances = await prisma.balance.findMany({
      where: { userId },
      select: {
        exchange: true,
        type: true,
        free: true,
        used: true,
        total: true,
        totalPositions: true,
      },
    });

    const positions = await prisma.position.findMany({
      where: { userId, status: "open" },
      select: { exchange: true },
    });

    const positionCounts = positions.reduce((acc, pos) => {
      acc[pos.exchange] = (acc[pos.exchange] || 0) + 1;
      return acc;
    }, {});

    const dashboardBalances = balances.map((b) => ({
      exchange: b.exchange,
      type: b.type || "spot",
      balance: {
        free: b.free,
        used: b.used,
        total: b.total,
      },
      totalPositions: positionCounts[b.exchange] || b.totalPositions || 0,
    }));

    res.json({ success: true, dashboard: { balances: dashboardBalances } });
  } catch (err) {
    logError(`Error fetching balance for user ${req.params.id}`, err);
    res.status(500).json({ success: false, error: "Failed to fetch balance data" });
  }
});

if (!process.argv.includes("--port")) {
  app.listen(5001, () => info(`🚀 Secure server running on port 5001`));
}