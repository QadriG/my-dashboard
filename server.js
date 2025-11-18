// server.js
import express from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import bodyParser from "body-parser";
import crypto from "crypto";
import prisma from "./prisma/client.mjs";
import { sendEmail } from "./src/utils/mailer.js";
import webhookRoutes from "./server/routes/webhookRoutes.mjs";
import adminRoutes from "./server/routes/adminRoutes.mjs";
import exchangesRoutes from "./server/routes/exchanges.mjs";
import { info as logInfo, error as logError } from "./server/utils/logger.mjs";
import encryptUtils from "./server/utils/encrypt.mjs";
import positionsRouter from "./server/routes/positions.mjs";
import usersRouter from "./server/routes/userRoutes.mjs";
import balancesRouter from "./server/routes/balances.mjs";
import manualPushRouter from "./server/routes/manualPush.mjs";
import { startPeriodicExchangeSync } from "./server/services/exchangeDataSync.mjs";
import logsRoutes from "./server/routes/logs.mjs";
import authRoutes from "./server/routes/auth.mjs";
import closePositionRoutes from "./server/routes/closePosition.mjs";

dotenv.config();
startPeriodicExchangeSync(60_000); // every 60s

const app = express();
app.set('trust proxy', 1);
const { encryptPassword, comparePassword } = encryptUtils;

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

const setAuthCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const authMiddleware = async (req, res, next) => {
  try {
    let token = req.cookies?.token;
    if (!token && req.headers.authorization) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (!token) return res.status(401).json({ error: "Unauthorized: No token" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return res.status(401).json({ error: "Unauthorized: User not found" });

    if (user.status === "paused" || user.status === "disabled") {
      return res.status(403).json({ error: `Your account is ${user.status}` });
    }

    if (decoded.tokenVersion !== user.tokenVersion) {
      return res.status(401).json({ error: "Token invalidated. Please log in again." });
    }

    req.user = user;
    next();
  } catch (err) {
    logError("Auth middleware error:", err);
    return res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
  }
};

const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: Admins only" });
  }
  next();
};

app.use(bodyParser.json());
app.use(cookieParser());

// Configure CORS to handle preflight requests correctly
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = process.env.CORS_WHITELIST
        ? process.env.CORS_WHITELIST.split(",")
        : ["http://localhost:3000", "http://localhost:5173"];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    // Add these options to handle preflight requests
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Length', 'X-Knowledge-Base'],
    maxAge: 86400, // 24 hours
  })
);

app.use(helmet());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// Register auth routes first
app.use("/api/auth", authRoutes);

// Other routes
app.use("/api/positions", authMiddleware, positionsRouter);
app.use("/api/exchanges", authMiddleware, exchangesRoutes);
app.use("/api/webhook", webhookRoutes);
app.use("/api/admin", authMiddleware, adminMiddleware, adminRoutes);
app.use("/api/users", authMiddleware, usersRouter);
app.use("/api/balances", balancesRouter);
app.use("/api/manual-push", authMiddleware, adminMiddleware, manualPushRouter);
app.use("/api/positions/close", authMiddleware, adminMiddleware, closePositionRoutes);

// Mock endpoints
app.get('/api/user/balance-history', authMiddleware, (req, res) => {
  res.json([
    { date: "2025-10-13", balance: 290 },
    { date: "2025-10-14", balance: 295 },
    { date: "2025-10-15", balance: 300 },
    { date: "2025-10-16", balance: 305 },
    { date: "2025-10-17", balance: 310 },
    { date: "2025-10-18", balance: 310.14 }
  ]);
});

app.get('/api/user/daily-pnl', authMiddleware, (req, res) => {
  res.json([
    { date: "2025-10-13", pnl: 5.2 },
    { date: "2025-10-14", pnl: -2.1 },
    { date: "2025-10-15", pnl: 8.7 },
    { date: "2025-10-16", pnl: 3.4 },
    { date: "2025-10-17", pnl: -1.2 },
    { date: "2025-10-18", pnl: 4.5 }
  ]);
});

app.get('/api/user/weekly-revenue', authMiddleware, (req, res) => {
  res.json({
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    revenues: [10, 12, 8, 15, 9, 14, 11]
  });
});

app.get('/api/user/best-trading-pairs', authMiddleware, (req, res) => {
  res.json([
    { pair: "BTC/USDT", profit: 220 },
    { pair: "ETH/USDT", profit: 180 },
    { pair: "SOL/USDT", profit: 95 }
  ]);
});

app.use("/api/logs", authMiddleware, logsRoutes);

// Add this for unhandled exceptions/rejections
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  logError(`BACKEND CRASH: Uncaught Exception: ${err.message || err}`);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  logError(`BACKEND CRASH: Unhandled Rejection: ${reason.message || reason}`);
});

app.listen(PORT, () => logInfo(`🚀 Server running on port ${PORT}`));