// === Imports ===
import express from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import bodyParser from "body-parser";
import http from "http";
import path from "path";

// Utils & services
import { sendEmail } from "./src/utils/mailer.js";
import webhookRoutes from "./server/routes/webhookRoutes.mjs";
import { initWebSocket } from "./server/services/websocketService.mjs";
import adminRoutes from "./server/routes/adminRoutes.mjs";
import exchangesRoutes from "./server/routes/exchanges.mjs";
import logger from "./server/utils/logger.mjs";
import encryptUtils from "./server/utils/encrypt.mjs";
import positionsRouter from "./server/routes/positions.mjs";
import usersRouter from "./server/routes/users.mjs";
import balancesRouter from "./server/routes/balances.mjs";
import chatRoutes from "./server/routes/chatRoutes.mjs"; 
import authRoutes from "./server/routes/auth.mjs"; // ✅ Auth routes

// === Setup ===
dotenv.config();
const app = express();
const prisma = new PrismaClient();
const { info, error: logError } = logger;
const { encryptPassword, comparePassword } = encryptUtils;

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

// === Middleware ===
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

// === Auth middleware ===
const authMiddleware = async (req, res, next) => {
  try {
    let token = req.cookies?.token || req.headers.authorization?.split(" ")[1];
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

// === Admin middleware ===
const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: Admins only" });
  }
  next();
};

// === Routes (Order matters!) ===

// 1️⃣ Auth routes mounted first
app.use("/api/auth", authRoutes);

// 2️⃣ Other public routes
app.use("/api/positions", positionsRouter);
app.use("/api/exchanges", exchangesRoutes);
app.use("/api/webhook", webhookRoutes);
app.use("/api/users", usersRouter);
app.use("/api/balances", balancesRouter);

// 3️⃣ Chat routes (protected)
app.use("/api/chat", authMiddleware, chatRoutes);

// 4️⃣ Admin routes (protected)
app.use("/api/admin", authMiddleware, adminMiddleware, adminRoutes);

// 5️⃣ Catch-all for frontend (if using SPA)
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "index.html"));
});

// === HTTP Server & WebSocket ===
const server = http.createServer(app);
initWebSocket(server);

// === Start server ===
server.listen(PORT, () => info(`🚀 Server running on port ${PORT}`));
