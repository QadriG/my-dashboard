import pkg from "@prisma/client";
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

const timestamp = () => new Date().toISOString();

// In your server/routes/logs.mjs file
async function logToDB(level, message, meta = {}) {
  try {
    await prisma.log.create({
      data: {
        userId: meta.userId || null,
        tvId: meta.tvId || null,
        exchange: meta.exchange || null,
        symbol: meta.symbol || null,
        request: meta.request || null,
        message,
        level, // ✅ This is correct, level is passed in
      },
    });
  } catch (err) {
    console.error("❌ Failed to write log to DB:", err);
  }
}

export async function info(message, meta = {}) {
  console.log(`[INFO] [${timestamp()}] ${message}`, meta);
  await logToDB("INFO", message, meta); // ✅ Level is set to "INFO"
}

export async function warn(message, meta = {}) {
  console.warn(`[WARN] [${timestamp()}] ${message}`, meta);
  await logToDB("WARN", message, meta); // ✅ Level is set to "WARN"
}

export async function error(message, meta = {}) {
  console.error(`[ERROR] [${timestamp()}] ${message}`, meta);
  await logToDB("ERROR", message, meta); // ✅ Level is set to "ERROR"
}

// ✅ NEW: Add the logEvent function that was missing
export async function logEvent({ userId, tvId, exchange, symbol, request, message, level = "INFO" }) {
  try {
    await prisma.log.create({
      data: {
        userId,
        tvId,
        exchange,
        symbol,
        request,
        message,
        level,
      },
    });
  } catch (err) {
    console.error("❌ Failed to save log:", err);
  }
}

export default { info, warn, error, logEvent }; // ✅ Export logEvent as well