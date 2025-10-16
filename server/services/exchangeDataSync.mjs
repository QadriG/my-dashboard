import { PrismaClient } from "@prisma/client";
import { getExchangeClient } from "./exchangeClients.mjs";
import { info, error as logError } from "../utils/logger.mjs";

const prisma = new PrismaClient();

/**
 * Fetch user's exchange data (balances + positions)
 */
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

      if (exchangeName === "bitunix") continue; // Handled separately

      try {
        const accountType = ex.type || "spot";
        const client = await getExchangeClient(
          exchangeName,
          ex.apiKey,
          ex.apiSecret,
          accountType,
          ex.passphrase || undefined
        );

        console.log(`[DEBUG] Fetching ${accountType.toUpperCase()} data for ${user.email} on ${exchangeName}`);

        let balanceRes, ordersRes, positionsRes;
        [balanceRes, ordersRes, positionsRes] = await Promise.allSettled([
          client.fetchBalance(),
          client.fetchOpenOrders(),
          accountType === "futures" && client.fetchPositions ? client.fetchPositions() : Promise.resolve([]),
        ]);

        if (balanceRes.status === "rejected") {
          logError(`[DEBUG] ${exchangeName} Balance Fetch Failed: ${balanceRes.reason}`);
        } else {
          console.log(`[DEBUG] ${exchangeName} Raw Balance Data:`, balanceRes.value);
        }

        const balance = balanceRes.status === "fulfilled" ? balanceRes.value : null;
        const openOrders = ordersRes.status === "fulfilled" ? ordersRes.value : [];
        const openPositions = positionsRes.status === "fulfilled" ? positionsRes.value : [];

        // Transform balance to card format
        let transformedBalance = null;
        if (balance && typeof balance === "object") {
          if (exchangeName === "binance" || exchangeName === "binanceusdm") {
            const total = balance.total?.USDT || 0;
            const available = balance.free?.USDT || 0;
            const used = balance.used?.USDT || (total - available);
            transformedBalance = { totalBalance: total, available, used };
          } else if (exchangeName === "okx") {
            const details = balance.info?.result?.details?.find(d => d.ccy === "USDT") || {};
            const total = parseFloat(details.cashBalance) || 0;
            const available = parseFloat(details.availBalance) || 0;
            const used = parseFloat(details.frozenBalance) || (total - available);
            transformedBalance = { totalBalance: total, available, used };
          } else if (exchangeName === "bybit") {
            const usdtBalance = balance.total?.USDT || balance.info?.result?.list?.find(l => l.coin === "USDT") || {};
            const total = usdtBalance.walletBalance || usdtBalance.total || 0;
            const available = usdtBalance.availableBalance || usdtBalance.free || 0;
            const used = total - available;
            transformedBalance = { totalBalance: total, available, used };
          } else if (exchangeName === "coinbase") {
            const usdtAccount = balance.info?.find(a => a.currency === "USDT") || {};
            const total = parseFloat(usdtAccount.balance) || 0;
            const available = parseFloat(usdtAccount.available) || 0;
            const used = parseFloat(usdtAccount.hold) || (total - available);
            transformedBalance = { totalBalance: total, available, used };
          } else if (exchangeName === "blofin") {
            const total = balance.total?.USDT || 0;
            const available = balance.free?.USDT || 0;
            const used = balance.used?.USDT || (total - available);
            transformedBalance = { totalBalance: total, available, used };
          } else if (exchangeName === "bitunix") {
            const total = balance.total?.USDT || 0;
            const available = balance.free?.USDT || 0;
            const used = balance.used?.USDT || (total - available);
            transformedBalance = { totalBalance: total, available, used };
          }

          results.push({
            exchange: exchangeName,
            type: accountType,
            balance: transformedBalance,
            openOrders,
            openPositions,
            error: null,
          });
        } else {
          results.push({
            exchange: exchangeName,
            type: accountType,
            balance: null,
            openOrders,
            openPositions,
            error: "No valid balance data",
          });
        }

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