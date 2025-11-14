import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// In your first logging file (where you have logError, logTradingError, etc.)
export async function logError({
  user = null,
  tvId = null,
  exchange = null,
  symbol = null,
  request = null,
  log = "Unknown error",
  createdAt = new Date()
}) {
  try {
    await prisma.log.create({
      data: {
        user,
        tvId,
        exchange,
        symbol,
        request: typeof request === 'object' ? JSON.stringify(request) : request,
        log, // This should be 'message' if you're following the schema
        level: "ERROR", // ✅ Explicitly set the level to "ERROR"
        createdAt
      }
    });
  } catch (err) {
    console.error('Failed to log error:', err);
  }
}

export async function logTradingError({
  user,
  tvId,
  exchange,
  symbol,
  request,
  error
}) {
  await logError({
    user,
    tvId,
    exchange,
    symbol,
    request,
    log: `TRADING ERROR: ${error.message || error}`,
    level: "ERROR" // ✅ Explicitly set the level
  });
}

export async function logApiError({
  user,
  tvId,
  exchange,
  symbol,
  request,
  error
}) {
  await logError({
    user,
    tvId,
    exchange,
    symbol,
    request,
    log: `API ERROR: ${error.message || error}`,
    level: "ERROR" // ✅ Explicitly set the level
  });
}

export async function logBackendError({
  user = null,
  tvId = null,
  exchange = null,
  symbol = null,
  request = null,
  error
}) {
  await logError({
    user,
    tvId,
    exchange,
    symbol,
    request,
    log: `BACKEND ERROR: ${error.message || error}`,
    level: "ERROR" // ✅ Explicitly set the level
  });
}