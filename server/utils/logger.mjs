// utils/logger.mjs
import pkg from "@prisma/client";
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

const timestamp = () => new Date().toISOString();

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
        level,
      },
    });
  } catch (err) {
    console.error("❌ Failed to write log to DB:", err);
  }
}

export async function info(message, meta = {}) {
  console.log(`[INFO] [${timestamp()}] ${message}`, meta);
  await logToDB("INFO", message, meta);
}

export async function warn(message, meta = {}) {
  console.warn(`[WARN] [${timestamp()}] ${message}`, meta);
  await logToDB("WARN", message, meta);
}

export async function error(message, meta = {}) {
  console.error(`[ERROR] [${timestamp()}] ${message}`, meta);
  await logToDB("ERROR", message, meta);
}

export default { info, warn, error };
