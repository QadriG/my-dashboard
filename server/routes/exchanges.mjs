import express from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middleware/authMiddleware.mjs";
import { encrypt } from "../utils/apiencrypt.mjs";
import ccxt from "ccxt";
import { syncUserExchangesImmediately } from "../services/exchangeDataSync.mjs";

const router = express.Router();
const prisma = new PrismaClient();

const supportedExchanges = [
  { id: "okx", name: "OKX" },
  { id: "blofin", name: "Blofin" },
  { id: "coinbase", name: "Coinbase" },
  { id: "bybit", name: "Bybit" },
  { id: "binance", name: "Binance" },
];

router.get("/list", (req, res) => {
  try {
    res.json({ success: true, exchanges: supportedExchanges });
  } catch (err) {
    console.error("Error fetching exchange list:", err);
    res.status(500).json({ success: false, error: "Failed to load exchanges" });
  }
});

router.post("/save", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { exchange, apiKey, apiSecret, passphrase, accountType } = req.body;

    if (!exchange || !apiKey || !apiSecret) {
      return res.status(400).json({ success: false, error: "All fields are required" });
    }

    const isSupported = supportedExchanges.some((ex) => ex.id === exchange);
    if (!isSupported) {
      return res.status(400).json({ success: false, error: "Unsupported exchange" });
    }

    const encryptedKey = encrypt(apiKey);
    const encryptedSecret = encrypt(apiSecret);
    const encryptedPassphrase = passphrase ? encrypt(passphrase) : null;

    await prisma.userExchange.upsert({
      where: { userId_provider: { userId, provider: exchange } },
      update: {
        apiKey: encryptedKey,
        apiSecret: encryptedSecret,
        passphrase: encryptedPassphrase,
        accountType: accountType || "spot",
      },
      create: {
        userId,
        provider: exchange,
        apiKey: encryptedKey,
        apiSecret: encryptedSecret,
        passphrase: encryptedPassphrase,
        accountType: accountType || "spot",
      },
    });

    syncUserExchangesImmediately(userId);
    res.json({ success: true, message: "API credentials saved successfully" });
  } catch (err) {
    console.error("Error saving exchange API keys:", err);
    res.status(500).json({ success: false, error: "Failed to save API keys" });
  }
});

router.get("/test/:exchange", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { exchange } = req.params;

    const userExchange = await prisma.userExchange.findUnique({
      where: { userId_provider: { userId, provider: exchange } },
    });

    if (!userExchange || !userExchange.apiKey || !userExchange.apiSecret) {
      return res.status(404).json({ success: false, error: "No API keys found for this exchange" });
    }

    const realKey = encrypt.decrypt(userExchange.apiKey);
    const realSecret = encrypt.decrypt(userExchange.apiSecret);
    const realPassphrase = userExchange.passphrase ? encrypt.decrypt(userExchange.passphrase) : undefined;

    const ExchangeClass = ccxt[exchange.toLowerCase()];
    if (!ExchangeClass) {
      return res.status(400).json({ success: false, error: `Exchange ${exchange} is not supported by CCXT` });
    }

    const client = new ExchangeClass({
      apiKey: realKey,
      secret: realSecret,
      password: realPassphrase,
      enableRateLimit: true,
    });

    const balances = await client.fetchBalance();
    res.json({ success: true, balances });
  } catch (err) {
    console.error("Error testing exchange API:", err);
    res.status(500).json({ success: false, error: "Server error while testing API keys" });
  }
});

router.get("/user/:id/balance", authMiddleware, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (req.user.role !== "admin" && req.user.id !== userId) {
      return res.status(403).json({ success: false, error: "Unauthorized" });
    }

    const balances = await prisma.balance.findMany({
      where: { userId },
      select: {
        provider: true,
        type: true,
        free: true,
        used: true,
        total: true,
        totalPositions: true,
      },
    });

    const positions = await prisma.position.findMany({
      where: { userId, status: "open" },
      select: { provider: true },
    });

    const positionCounts = positions.reduce((acc, pos) => {
      acc[pos.provider] = (acc[pos.provider] || 0) + 1;
      return acc;
    }, {});

    const dashboardBalances = balances.map((b) => ({
      provider: b.provider,
      type: b.type || "spot",
      balance: {
        free: b.free,
        used: b.used,
        total: b.total,
      },
      totalPositions: positionCounts[b.provider] || b.totalPositions || 0,
    }));

    res.json({ success: true, dashboard: { balances: dashboardBalances } });
  } catch (err) {
    console.error("Error fetching user balance:", err);
    res.status(500).json({ success: false, error: "Failed to fetch balance data" });
  }
});

export default router;
