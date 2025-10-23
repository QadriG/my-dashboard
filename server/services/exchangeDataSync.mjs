// services/exchangeDataSync.mjs
import PrismaClientPkg from "@prisma/client";
const { PrismaClient } = PrismaClientPkg;
import { fetchExchangeData } from "./exchangeManager.mjs";
import { info, error as logError } from "../utils/logger.mjs";

const prisma = new PrismaClient();

export const fetchUserExchangeData = async (userId) => {
  try {
    const numericUserId = parseInt(userId, 10);
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

      try {
        const accountType = ex.type || "spot";
        console.log(`[DEBUG] Fetching ${accountType.toUpperCase()} data for ${user.email} on ${exchangeName}`);

        const exchangeResult = await fetchExchangeData(
          ex.provider,
          ex.apiKey,
          ex.apiSecret,
          ex.passphrase,
          accountType
        );

        // 🔸 Calculate totals for PnL snapshot
        const positions = exchangeResult.openPositions || [];
        let totalUnrealizedPnl = 0;
        positions.forEach(p => {
          totalUnrealizedPnl += parseFloat(p.unrealizedPnl) || 0;
        });
        const totalBalance = exchangeResult.balance?.totalBalance || 0;

        // 🔸 Save daily PnL snapshot
        const today = new Date();
        today.setHours(0, 0, 0, 0); // normalize to start of day
        await prisma.dailyPnLSnapshot.upsert({
          where: { userId_date: { userId: numericUserId, date: today } },
          update: {
            totalBalance,
            totalUnrealizedPnl,
            positions: positions,
          },
          create: {
            userId: numericUserId,
            date: today,
            totalBalance,
            totalUnrealizedPnl,
            totalRealizedPnl: 0, // accumulate later if needed
            positions: positions,
          },
        });

        results.push({
          exchange: exchangeName,
          type: accountType,
          balance: exchangeResult.balance,
          openOrders: exchangeResult.openOrders || [],
          openPositions: positions,
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

export async function syncUserExchangesImmediately(userId) {
  try {
    const data = await fetchUserExchangeData(userId);
    info(`✅ Synced exchange data for user ${userId}`);
    return data;
  } catch (err) {
    logError(`syncUserExchangesImmediately failed for user ${userId}`, err);
  }
}

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