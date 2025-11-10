import PrismaClientPkg from "@prisma/client";
const { PrismaClient } = PrismaClientPkg;
import { fetchExchangeData } from "./exchangeManager.mjs";
import { info, error as logError } from "../utils/logger.mjs"; // ❌ Remove logEvent import

const prisma = new PrismaClient();

export const fetchUserExchangeData = async (userId) => {
  try {
    const numericUserId = parseInt(userId, 10);
    if (isNaN(numericUserId)) {
      logError(`Invalid userId: ${userId} is not a valid number`); // ✅ Use existing logger
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

        const positions = exchangeResult.openPositions || [];
        let totalUnrealizedPnl = 0;
        positions.forEach(p => {
          totalUnrealizedPnl += parseFloat(p.unrealizedPnl) || 0;
        });
        const totalBalance = exchangeResult.balance?.totalBalance || 0;

        // 🔸 TODAY as Date object (Prisma-safe)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayDate = new Date(today);
        const todayStr = today.toISOString().split('T')[0];

        // 🔸 Calculate today's realized PnL
        let todayRealizedPnl = 0;
        const allExecutions = exchangeResult.closedExecutions || [];
        const todayExecutions = allExecutions.filter(exec => {
          if (!exec || typeof exec !== 'object') {
            console.warn(`[WARN] Invalid execution object:`, exec);
            return false;
          }
          const execDate = new Date(exec.execTime).toISOString().split('T')[0];
          return execDate === todayStr;
        });

        todayRealizedPnl = todayExecutions.reduce((sum, exec) => {
          if (!exec || typeof exec !== 'object') {
            console.warn(`[WARN] Invalid execution object in reduce:`, exec);
            return sum;
          }
          return sum + (exec.closedPnl || 0);
        }, 0);

        // 🔸 Save ALL executions to DB (avoid duplicates via execId)
        for (const exec of allExecutions) {
          // ✅ Safety check: Ensure exec is a valid object and has execId
          if (!exec || typeof exec !== 'object') {
            console.warn(`[WARN] Skipping invalid execution object:`, exec);
            continue;
          }

          if (!exec.execId) {
            console.warn(`[WARN] Execution missing execId, skipping save:`, exec);
            continue; // Skip saving if execId is missing
          }

          try {
            await prisma.execution.upsert({
              where: { execId: exec.execId },
              update: {}, // executions are immutable
              create: {
                userId: numericUserId,
                execId: exec.execId,
                symbol: exec.symbol || 'UNKNOWN',
                side: exec.side || 'UNKNOWN',
                qty: exec.qty || 0,
                price: exec.price || 0,
                closedPnl: exec.closedPnl || 0,
                fee: exec.fee || 0,
                execTime: new Date(exec.execTime),
              }
            });
          } catch (err) {
            console.warn(`[WARN] Could not save execution ${exec.execId}:`, err.message);
          }
        }

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