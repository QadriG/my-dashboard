import express from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import bodyParser from "body-parser";
import { PrismaClient } from "@prisma/client"; // Import Prisma
import { syncUserExchangesImmediately } from "./server/services/exchangeDataSync.mjs"; // Adjust path
import { info, error as logError } from "./server/utils/logger.mjs";

dotenv.config();

// Initialize Prisma client globally
const prisma = new PrismaClient();

console.log("Available Prisma models:", Object.keys(prisma)); // Debug log

const app = express();
const PORT = process.env.SECURE_PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

const authMiddleware = async (req, res, next) => {
  try {
    let token = req.cookies?.token;
    if (!token && req.headers.authorization) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (!token) {
      logError("Unauthorized access attempt: no token provided");
      return res.status(401).json({ error: "Unauthorized: No token" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return res.status(401).json({ error: "Unauthorized: User not found" });

    req.user = user;
    next();
  } catch (err) {
    logError("Auth middleware error:", err);
    return res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
  }
};

app.use(bodyParser.json());
app.use(cookieParser());
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = process.env.CORS_WHITELIST
        ? process.env.CORS_WHITELIST.split(",")
        : ["http://localhost:3000", "http://localhost:5173"];
      if (!origin || allowedOrigins.includes(origin)) callback(null, true);
      else callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(helmet());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// Existing endpoint
app.get("/api/exchange/sync/:userId", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const exchangeData = await syncUserExchangesImmediately(userId);
    if (!exchangeData || exchangeData.length === 0) {
      return res.status(404).json({ error: "No exchange data available for user" });
    }
    res.json(exchangeData);
  } catch (err) {
    logError(`Failed to sync exchange data for user ${req.params.userId}:`, err);
    res.status(500).json({ error: "Failed to fetch exchange data" });
  }
});

// New endpoint to delete API key
app.delete("/api/exchange/delete-api/:userId/:exchange", authMiddleware, async (req, res) => {
  try {
    const { userId, exchange } = req.params;
    const numericUserId = parseInt(userId, 10);
    if (isNaN(numericUserId)) {
      return res.status(400).json({ error: "Invalid userId" });
    }

    await prisma.userExchangeAccount.deleteMany({
      where: { userId: numericUserId, provider: exchange },
    });

    info(`✅ API key deleted for user ${numericUserId} on ${exchange}`);
    res.json({ message: "API key deleted successfully" });
  } catch (err) {
    logError(`Failed to delete API key for user ${numericUserId} on ${exchange}:`, err);
    res.status(500).json({ error: "Server error deleting API key" });
  }
});

// New endpoint to save API key
app.post("/api/exchange/save-api-key", authMiddleware, async (req, res) => {
  try {
    console.log("Received save-api-key request:", req.body);
    if (!prisma.userExchangeAccount) {
      logError("Prisma userExchangeAccount model is undefined");
      return res.status(500).json({ error: "Server configuration error" });
    }

    const { userId, exchange, apiKey, apiSecret, passphrase = null, type = "spot" } = req.body;
    if (!userId || !exchange || !apiKey || !apiSecret) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const numericUserId = parseInt(userId, 10);
    if (isNaN(numericUserId)) {
      return res.status(400).json({ error: "Invalid userId" });
    }

    // Check if the exchange already exists for the user
    const existingExchange = await prisma.userExchangeAccount.findFirst({
      where: { userId: numericUserId, provider: exchange, type },
    });

    if (existingExchange) {
      await prisma.userExchangeAccount.update({
        where: { id: existingExchange.id },
        data: { apiKey, apiSecret, passphrase, type, updatedAt: new Date() },
      });
    } else {
      await prisma.userExchangeAccount.create({
        data: {
          userId: numericUserId,
          provider: exchange,
          apiKey,
          apiSecret,
          passphrase,
          type,
          ccxtId: exchange.toLowerCase(),
        },
      });
    }

    info(`✅ API key saved for user ${numericUserId} on ${exchange}`);
    res.json({ message: "API key saved successfully" });
  } catch (err) {
    logError(`Failed to save API key for user:`, err);
    res.status(500).json({ error: "Server error saving API key" });
  }
});

// Existing routes...

app.listen(PORT, () => info(`🚀 Secure server running on port ${PORT}`));