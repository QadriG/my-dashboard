import express from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import bodyParser from "body-parser";
import crypto from "crypto";

// ✅ Import wrapped Prisma client
import prisma from "./prisma/client.mjs";

// Utils & services
import { sendEmail } from "./src/utils/mailer.js";
import webhookRoutes from "./server/routes/webhookRoutes.mjs";
import adminRoutes from "./server/routes/adminRoutes.mjs";
import exchangesRoutes from "./server/routes/exchanges.mjs";
import logger from "./server/utils/logger.mjs";
import encryptUtils from "./server/utils/encrypt.mjs";
import positionsRouter from "./server/routes/positions.mjs";
import usersRouter from "./server/routes/users.mjs";
import balancesRouter from "./server/routes/balances.mjs";
import manualPushRouter from "./server/routes/manualPush.mjs";
import { encrypt } from "./server/utils/apiencrypt.mjs"; // Import for manual encryption if needed
import { fetchUserExchangeData, startPeriodicExchangeSync } from "./server/services/exchangeDataSync.mjs";
import exchangeRoutes from "./server/routes/exchanges.mjs"; // Adjust path as needed

// Load environment variables
dotenv.config();

startPeriodicExchangeSync(60_000); // every 60s

const app = express();
const { info, error: logError } = logger;
const { encryptPassword, comparePassword } = encryptUtils;

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
const SERVER_URL = process.env.SERVER_URL || `http://localhost:${PORT}`;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";
function setAuthCookie(res, token) {
  res.cookie("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

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

// ✅ NOW it’s safe to use app
app.use("/api/exchange", exchangeRoutes);


// === Auth middleware ===
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

// === Admin middleware ===
const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: Admins only" });
  }
  next();
};

// === Routes ===
app.use("/api/positions", positionsRouter);
app.use("/api/exchanges", authMiddleware, exchangesRoutes); // ✅ secure with auth
app.use("/api/webhook", webhookRoutes);
app.use("/api/admin", authMiddleware, adminMiddleware, adminRoutes);
app.use("/api/users", usersRouter);
app.use("/api/balances", balancesRouter);
app.use("/api/manual-push", authMiddleware, manualPushRouter);

// === Dashboard Routes ===
app.get("/api/user/balance", authMiddleware, async (req, res) => {
  console.log(`Fetching balance for user ${req.user.id}`);
  try {
    const userId = req.user.id;
    const exchangeData = await fetchUserExchangeData(userId);
    console.log(`Exchange Data returned for user ${req.user.id}:`, exchangeData);

    const balanceData = exchangeData.map((ex) => {
      const balanceEntry = ex.balances.data ? ex.balances.data.find(b => b.coin === 'USDT') : null;
      return {
        exchange: ex.exchange,
        totalBalance: balanceEntry ? parseFloat(balanceEntry.balance) : 0,
        available: balanceEntry ? parseFloat(balanceEntry.balance) - parseFloat(balanceEntry.balanceLocked || 0) : 0,
        long: 0,
        short: 0,
        totalPositions: ex.positions.length || 0,
      };
    });

    res.json({ success: true, balanceData });
    console.log(`Balance response sent for user ${req.user.id}:`, { success: true, balanceData });
  } catch (err) {
    logError(`Error fetching balance for user ${req.user.id}`, err);
    res.status(500).json({ success: false, message: "Error fetching balance" });
  }
});

app.get("/api/user/dashboard", authMiddleware, async (req, res) => {
  console.log(`Fetching dashboard for user ${req.user.id}`);
  try {
    const userId = req.user.id;
    const exchangeData = await fetchUserExchangeData(userId);
    console.log(`Exchange Data returned for user ${req.user.id}:`, exchangeData);

    const dashboardData = {
      profit: { total: 0, long: 0, short: 0 },
      upl: { total: 0, totalPercent: 0, long: 0, longPercent: 0, short: 0, shortPercent: 0 },
      fundsDistribution: {
        totalBalance: exchangeData.reduce((sum, ex) => {
          const balanceEntry = ex.balances.data ? ex.balances.data.find(b => b.coin === 'USDT') : null;
          return sum + (balanceEntry ? parseFloat(balanceEntry.balance) : 0);
        }, 0),
        available: exchangeData.reduce((sum, ex) => {
          const balanceEntry = ex.balances.data ? ex.balances.data.find(b => b.coin === 'USDT') : null;
          return sum + (balanceEntry ? parseFloat(balanceEntry.balance) - parseFloat(balanceEntry.balanceLocked || 0) : 0);
        }, 0),
        long: 0,
        short: 0,
        totalPositions: exchangeData.reduce((sum, ex) => sum + ex.positions.length, 0),
      },
      balanceGraph: {
        balances: {
          data: exchangeData.map((ex) => {
            const balanceEntry = ex.balances.data ? ex.balances.data.find(b => b.coin === 'USDT') : null;
            return {
              exchange: ex.exchange,
              balance: balanceEntry ? parseFloat(balanceEntry.balance) : 0,
              timestamp: new Date().toISOString(),
            };
          }),
        },
      },
      weeklyRevenue: { labels: ["Week 1", "Week 2"], revenues: [0, 0] },
      dailyPnL: {},
      bestTradingPairs: {},
      openPositions: exchangeData.reduce((acc, ex) => ({ ...acc, [ex.exchange]: ex.positions }), {}),
    };

    res.json(dashboardData);
    console.log(`Dashboard response sent for user ${req.user.id}:`, dashboardData);
  } catch (err) {
    logError(`Error fetching dashboard for user ${req.user.id}`, err);
    res.status(500).json({ success: false, message: "Error fetching dashboard" });
  }
});

// === Auth Routes ===
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields required" });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ message: "Email already registered" });

    const hashed = await encryptPassword(password);
    const role = email === "info@tradingmachine.ai" ? "admin" : "user";

    const user = await prisma.user.create({
      data: { name, email, password: hashed, role, isVerified: false, tokenVersion: 1 },
    });

    const verifyToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "1d" });
    await prisma.user.update({ where: { id: user.id }, data: { verificationToken: verifyToken } });

    const verifyLink = `${SERVER_URL}/api/auth/verify-email?token=${encodeURIComponent(verifyToken)}`;

    try {
      await sendEmail(
        user.email,
        "Verify your QuantumCopyTrading account",
        `<p>Hello ${name},</p>
         <p>Please verify your email by clicking below:</p>
         <p><a href="${verifyLink}" target="_blank">Verify Email</a></p>
         <p>Link expires in 24h.</p>`
      );
    } catch (err) {
      logError("Failed to send verification email:", err);
    }

    res.json({ message: "Signup successful! Check email to verify account." });
  } catch (err) {
    logError("Signup error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });
    if (!user.isVerified) return res.status(403).json({ message: "Email not verified" });

    if (user.status === "paused" || user.status === "disabled") {
      return res.status(403).json({ message: `Your account is ${user.status}` });
    }

    const valid = await comparePassword(password, user.password);
    if (!valid) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, role: user.role, tokenVersion: user.tokenVersion },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    setAuthCookie(res, token);

    res.json({
      message: "Login successful",
      user: { id: user.id, email: user.email, role: user.role, status: user.status },
    });
  } catch (err) {
    logError("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/auth/check-auth", authMiddleware, async (req, res) => {
  const user = req.user;
  res.json({
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
    isVerified: user.isVerified,
  });
});

app.get("/api/auth/verify-email", async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).send("Missing verification token");
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(400).send("Invalid or expired verification link");
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) return res.status(400).send("User not found");
    if (user.isVerified) return res.send("Email already verified. You can log in.");

    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, verificationToken: null },
    });

    return res.redirect(`${CLIENT_URL}/login?verified=success`);
  } catch (err) {
    logError("Verify email error:", err);
    return res.status(500).send("Server error verifying email");
  }
});

app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ message: "Email not found" });

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExp = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.user.update({
      where: { email },
      data: { resetToken, resetTokenExp: resetExp },
    });

    const resetLink = `${CLIENT_URL}/my-dashboard/reset-password/${resetToken}`;
    try {
      await sendEmail(
        email,
        "Reset your QuantumCopyTrading password",
        `<p>Hello ${user.name || "User"},</p>
         <p>Click below to reset your password:</p>
         <a href="${resetLink}" target="_blank">Reset Password</a>
         <p>Link expires in 15 min.</p>`
      );
    } catch (err) {
      logError("Failed reset email:", err);
    }

    res.json({ message: "Password reset email sent" });
  } catch (err) {
    logError("Forgot password error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/auth/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await prisma.user.findFirst({
      where: { resetToken: token, resetTokenExp: { gt: new Date() } },
    });
    if (!user) return res.status(400).json({ message: "Invalid or expired token" });

    const hashed = await encryptPassword(password);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed, resetToken: null, resetTokenExp: null },
    });

    res.json({ message: "Password reset successful" });
  } catch (err) {
    logError("Reset password error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
  return res.json({ message: "Logged out" });
});

app.post("/api/save-api-key", authMiddleware, async (req, res) => {
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
      update: { apiKey: encryptedKey, apiSecret: encryptedSecret, passphrase: encryptedPassphrase },
      create: { userId: req.user.id, exchange, apiKey: encryptedKey, apiSecret: encryptedSecret, passphrase: encryptedPassphrase },
    });

    res.json({ message: "API key saved successfully" });
  } catch (err) {
    logError("Error saving API key", err);
    res.status(500).json({ message: "Server error" });
  }
});

// === Extra secured routes ===
app.get("/user/profile", authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

app.get("/admin/dashboard", authMiddleware, adminMiddleware, (req, res) => {
  res.json({ message: "Welcome Admin", user: req.user });
});

// === Run both Servers ===
const startServers = async () => {
  const { concurrently } = await import("concurrently"); // ✅ ESM safe

  const processes = concurrently(
    [
      { command: "node server.js --port 5000", name: "MainServer", prefixColor: "blue" },
      { command: "node secureServer.js --port 5001", name: "SecureServer", prefixColor: "green" },
    ],
    {
      killOthersOnFail: true,
      killOthersOnSuccess: true,
      restartTries: 3,
    }
  );

  processes.result.catch((err) => {
    logError("Error starting servers:", err);
  });

  processes.result.then(() => {
    info("All servers stopped");
  });
};

// === Start server ===
if (!process.argv.includes("--port")) {
  startServers();
} else {
  app.listen(PORT, () => info(`🚀 Server running on port ${PORT}`));
}