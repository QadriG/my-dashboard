// server/routes/exchanges.mjs
import express from "express";

const router = express.Router();

// ✅ Only allow supported exchanges
const supportedExchanges = [
  { id: "okx", name: "OKX" },
  { id: "bitunix", name: "Bitunix" },
  { id: "blofin", name: "Blofin" },
  { id: "coinbase", name: "Coinbase" },
  { id: "bybit", name: "Bybit" },
  { id: "binance", name: "Binance" }, // ✅ Binance.com only
];

// GET /api/exchanges/list
router.get("/list", (req, res) => {
  try {
    res.json({ success: true, exchanges: supportedExchanges });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to load exchanges" });
  }
});

export default router;
