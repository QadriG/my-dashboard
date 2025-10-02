// server/routes/manualPush.mjs
import express from "express";
import { ExchangeManager } from "../services/exchangeManager.mjs";

const router = express.Router();

// Example user store: in production, fetch from DB
const userAccounts = {
  0: { exchange: "bitunix", apiKey: "USER0_KEY", secret: "USER0_SECRET" },
  1: { exchange: "binance", apiKey: "USER1_KEY", secret: "USER1_SECRET" },
  2: { exchange: "bybit", apiKey: "USER2_KEY", secret: "USER2_SECRET" },
};

router.post("/", async (req, res) => {
  const { users, data } = req.body;
  if (!users || !data) {
    return res.status(400).json({ error: "Missing users or data" });
  }

  const results = [];

  for (const userId of users) {
    const account = userAccounts[userId];
    if (!account) {
      results.push({ userId, status: "failed", error: "No account found" });
      continue;
    }

    try {
      const manager = new ExchangeManager({
        exchange: account.exchange,
        apiKey: account.apiKey,
        apiSecret: account.secret,
        type: data.market_position?.toLowerCase().includes("future") ? "futures" : "spot",
      });

      let response;

      if (data.action === "buy" || data.action === "sell") {
        response = await manager.placeOrder({
          symbol: data.symbol.replace(":", ""), // normalize
          side: data.action,
          amount: data.qty,
          price: data.price || undefined,
        });
      } else if (data.action === "close") {
        response = await manager.closeOrder(data.orderId, data.symbol.replace(":", ""));
      } else if (data.action === "balance") {
        response = await manager.fetchBalance();
      }

      results.push({ userId, status: "success", exchange: account.exchange, response });
    } catch (err) {
      console.error(`❌ User ${userId} failed on ${account.exchange}:`, err.message);
      results.push({ userId, status: "failed", error: err.message });
    }
  }

  res.json({ results });
});

export default router;
