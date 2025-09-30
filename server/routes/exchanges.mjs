// server/routes/exchanges.mjs
import express from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middleware/authMiddleware.mjs";
import apiEncrypt from "../utils/apiencrypt.mjs";
import ccxt from "ccxt";

const router = express.Router();
const prisma = new PrismaClient();

import { syncUserExchangesImmediately } from "../services/exchangeDataSync.mjs";

// ✅ Supported exchanges
const supportedExchanges = [
  { id: "okx", name: "OKX" },
  { id: "bitunix", name: "Bitunix" },
  { id: "blofin", name: "Blofin" },
  { id: "coinbase", name: "Coinbase" },
  { id: "bybit", name: "Bybit" },
  { id: "binance", name: "Binance" },
];

// --- GET /api/exchanges/list ---
router.get("/list", (req, res) => {
  try {
    res.json({ success: true, exchanges: supportedExchanges });
  } catch (err) {
    console.error("Error fetching exchange list:", err);
    res.status(500).json({ success: false, error: "Failed to load exchanges" });
  }
});

// --- POST /api/exchanges/save ---
router.post("/save", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { exchange, apiKey, apiSecret } = req.body;

    if (!exchange || !apiKey || !apiSecret) {
      return res.status(400).json({ success: false, error: "All fields required" });
    }

    const isSupported = supportedExchanges.some((ex) => ex.id === exchange);
    if (!isSupported) {
      return res.status(400).json({ success: false, error: "Unsupported exchange" });
    }

    // 🔐 Encrypt before saving
    const encryptedKey = apiEncrypt.encrypt(apiKey);
    const encryptedSecret = apiEncrypt.encrypt(apiSecret);

    // ✅ Upsert user exchange record
    await prisma.userExchange.upsert({
      where: { userId_exchange: { userId, exchange } },
      update: { apiKey: encryptedKey, apiSecret: encryptedSecret },
      create: { userId, exchange, apiKey: encryptedKey, apiSecret: encryptedSecret },
    });

    // Trigger fetch & WebSocket push
    syncUserExchangesImmediately(userId);

    res.json({ success: true, message: "API credentials saved" });
  } catch (err) {
    console.error("Error saving exchange API keys:", err);
    res.status(500).json({ success: false, error: "Failed to save API keys" });
  }
});

// --- GET /api/exchanges/test/:exchange ---
router.get("/test/:exchange", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { exchange } = req.params;

    const userExchange = await prisma.userExchange.findUnique({
      where: { userId_exchange: { userId, exchange } },
    });

    if (!userExchange || !userExchange.apiKey || !userExchange.apiSecret) {
      return res.status(404).json({ success: false, error: "No API keys found for this exchange" });
    }

    // 🔓 Decrypt keys
    const realKey = apiEncrypt.decrypt(userExchange.apiKey);
    const realSecret = apiEncrypt.decrypt(userExchange.apiSecret);

    // ✅ Initialize CCXT exchange safely
    const ccxtExchangeClass = ccxt[exchange.toLowerCase()];
    if (!ccxtExchangeClass) {
      return res.status(400).json({
        success: false,
        error: `Exchange ${exchange} is not supported by CCXT`,
      });
    }

    const client = new ccxtExchangeClass({
      apiKey: realKey,
      secret: realSecret,
      enableRateLimit: true,
    });

    let balances;
    try {
      balances = await client.fetchBalance();
    } catch (err) {
      console.error(`CCXT fetchBalance error for ${exchange}:`, err);
      return res.status(500).json({ success: false, error: "Failed to fetch balances" });
    }

    res.json({ success: true, balances });
  } catch (err) {
    console.error("Error testing exchange API:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

export default router;
