import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

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
        log,
        createdAt
      }
    });
  } catch (err) {
    console.error('Failed to log error:', err);
  }
}

// Export a convenience function for common error types
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
    log: `TRADING ERROR: ${error.message || error}`
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
    log: `API ERROR: ${error.message || error}`
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
    log: `BACKEND ERROR: ${error.message || error}`
  });
}