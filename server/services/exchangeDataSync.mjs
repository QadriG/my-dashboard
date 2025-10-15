import pkg from "@prisma/client";
const { PrismaClient } = pkg;

import { getExchangeClient } from "./exchangeClients.mjs";
import { info, error as logError } from "../utils/logger.mjs";

const prisma = new PrismaClient();

/**
 * Fetch user's exchange data (balances + positions)
 */
export const fetchUserExchangeData = async (userId) => {
  try {
    const numericUserId = parseInt(userId, 10); // Convert to integer
    if (isNaN(numericUserId)) {
      throw new Error(`Invalid userId: ${userId} is not a valid number`);
    }

    const user = await prisma.user.findUnique({
      where: { id: numericUserId },
      select: {
        id: true,
        email: true,
        exchanges: {
          select: {
            provider: true,
            apiKey: true,
            apiSecret: true,
            passphrase: true,
            type: true,
          },
        },
      },
    });

    if (!user) {
      console.warn(`[WARN] No user found with id ${numericUserId}`);
      return [];
    }

    if (!user.exchanges?.length) {
      console.warn(`[WARN] User ${numericUserId} has no exchanges linked`);
      return [];
    }

    const results = [];

    for (const ex of user.exchanges) {
      const exchangeName = ex.provider?.toLowerCase();
      if (!ex.apiKey || !ex.apiSecret) {
        console.warn(`[WARN] Skipping ${exchangeName} for user ${numericUserId} — Missing API credentials`);
        continue;
      }

      // ✅ Skip Bitunix (handled separately)
      if (exchangeName === "bitunix") continue;

      try {
        const accountType = ex.type || "spot";

        const client = getExchangeClient(
          exchangeName,
          ex.apiKey,
          ex.apiSecret,
          accountType,
          ex.passphrase || undefined
        );

        console.log(`[DEBUG] Fetching ${accountType.toUpperCase()} data for ${user.email} on ${exchangeName}`);

        const [balanceRes, ordersRes, positionsRes] = await Promise.allSettled([
          client.fetchBalance(),
          client.fetchOpenOrders(),
          accountType === "futures" && client.fetchPositions
            ? client.fetchPositions()
            : Promise.resolve([]),
        ]);

        const balance = balanceRes.status === "fulfilled" ? balanceRes.value : null;
        const openOrders = ordersRes.status === "fulfilled" ? ordersRes.value : [];
        const openPositions = positionsRes.status === "fulfilled" ? positionsRes.value : [];

        results.push({
          exchange: exchangeName,
          type: accountType,
          balance,
          openOrders,
          openPositions,
          error: null,
        });

        info(`✅ ${exchangeName} (${accountType}) data fetched for user ${numericUserId}`);
      } catch (innerErr) {
        logError(`❌ Failed ${ex.provider} (${ex.type}) for user ${numericUserId}`, innerErr?.message || innerErr);
        results.push({
          exchange: ex.provider,
          type: ex.type || "spot",
          balance: null,
          openOrders: [],
          openPositions: [],
          error: innerErr?.message || "Unknown error",
        });
      }

      await new Promise((r) => setTimeout(r, 300));
    }

    return results;
  } catch (err) {
    logError(`User ${userId} — fetchUserExchangeData failed`, err?.message || err);
    return [];
  }
};

/**
 * Manual one-time sync for a specific user
 */
export async function syncUserExchangesImmediately(userId) {
  try {
    const data = await fetchUserExchangeData(userId);
    info(`✅ Synced exchange data for user ${userId}`);
    return data;
  } catch (err) {
    logError(`syncUserExchangesImmediately failed for user ${userId}`, err);
  }
}

/**
 * Periodic background sync for all users
 */
export async function startPeriodicExchangeSync() {
  try {
    const users = await prisma.user.findMany({ select: { id: true, email: true } });
    console.log(`[DEBUG] Loaded ${users.length} users for periodic sync`);

    for (const u of users) {
      await syncUserExchangesImmediately(u.id);
    }

    console.log("✅ Periodic exchange sync completed successfully");
  } catch (err) {
    console.error("[ERROR] startPeriodicExchangeSync failed:", err);
  }
}