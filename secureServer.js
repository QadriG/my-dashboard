import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "./server/middleware/authMiddleware.mjs";
import { info, error as logError } from "./server/utils/logger.mjs";
import { encrypt } from "./server/utils/apiencrypt.mjs";
import { syncUserExchangesImmediately } from "./server/services/exchangeDataSync.mjs";

const app = express();
const prisma = new PrismaClient();

// ✅ Enable CORS before everything else
app.use(cors({
  origin: "http://localhost:3000", // your React app
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// ✅ Require auth AFTER CORS and json parser
app.use(authMiddleware);

app.post("/api/save-api-key", async (req, res) => {
  try {
    const { exchange, apiKey, apiSecret, passphrase } = req.body;
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
        passphrase: encryptedPassphrase
      },
      create: {
        userId: req.user.id,
        exchange,
        apiKey: encryptedKey,
        apiSecret: encryptedSecret,
        passphrase: encryptedPassphrase
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

if (!process.argv.includes("--port")) {
  app.listen(5001, () => info(`🚀 Secure server running on port 5001`));
}
