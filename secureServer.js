import express from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import bodyParser from "body-parser";
import { syncUserExchangesImmediately } from "./services/exchangeDataSync.mjs"; // Adjust path if needed
import { info, error as logError } from "./utils/logger.mjs";

dotenv.config();

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

// Existing middleware and routes...
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

// New endpoint for exchange sync
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

// Existing routes (e.g., /api/exchange, /api/admin, etc.)...

app.listen(PORT, () => info(`🚀 Secure server running on port ${PORT}`));