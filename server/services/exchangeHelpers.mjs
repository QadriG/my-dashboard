// server/services/exchangeHelpers.mjs
import { PrismaClient } from "@prisma/client";
import { BitunixClient } from "../services/bitunixClient.mjs";
import { encrypt } from "../utils/apiencrypt.mjs";
import { info, error as logError } from "../utils/logger.mjs";

const prisma = new PrismaClient();

/**
 * Return decrypted APIs for a user
 * [{ id, exchangeName, apiKey, apiSecret, spotEnabled, futuresEnabled }]
 */
export async function getUserApis(userId) {
  const apis = await prisma.userAPI.findMany({ where: { userId } });
  return apis.map((a) => ({
    id: a.id,
    exchangeName: a.exchangeName,
    spotEnabled: a.spotEnabled,
    futuresEnabled: a.futuresEnabled,
    apiKey: encrypt.decrypt(a.apiKey),
    apiSecret: encrypt.decrypt(a.apiSecret),
  }));
}

/**
 * Fetch balances for a user across all saved APIs.
 * Returns:
 * { totalByExchange: [{ exchange, raw }], aggregated: { /* sum by currency */ } }
 */
export async function fetchBalances(userId) {
  const apis = await getUserApis(userId);
  const totalByExchange = [];
  const aggregated = {}; // { "BTC": {free, used, total}, ... }

  for (const api of apis) {
    try {
      const client = new BitunixClient({
        apiKey: api.apiKey,
        apiSecret: api.apiSecret,
        type: api.spotEnabled ? "spot" : "spot",
      });

      const res = await client.fetchBalance(); // raw bitunix response
      // BitunixClient returns whatever the API returns; normalize if needed
      totalByExchange.push({ exchange: api.exchangeName, raw: res });

      // try to extract assets list / balances robustly:
      const assets = res?.data?.assets || res?.data || res?.assets || res?.balances || null;

      if (Array.isArray(assets)) {
        for (const asset of assets) {
          // common shapes: {currency, free, locked}, or {asset, available}
          const symbol = asset.currency || asset.asset || asset.coin || asset.symbol;
          const free = parseFloat(asset.free ?? asset.available ?? asset.availableBalance ?? 0);
          const used = parseFloat(asset.locked ?? asset.lock ?? asset.freeze ?? 0);
          const total = free + used;
          if (!symbol) continue;
          if (!aggregated[symbol]) aggregated[symbol] = { free: 0, used: 0, total: 0 };
          aggregated[symbol].free += free;
          aggregated[symbol].used += used;
          aggregated[symbol].total += total;
        }
      } else if (typeof assets === "object" && assets !== null) {
        // if API returns object keyed by symbol
        for (const [symbol, val] of Object.entries(assets)) {
          const free = parseFloat(val.free ?? val.available ?? 0);
          const used = parseFloat(val.locked ?? val.lock ?? 0);
          const total = free + used;
          if (!aggregated[symbol]) aggregated[symbol] = { free: 0, used: 0, total: 0 };
          aggregated[symbol].free += free;
          aggregated[symbol].used += used;
          aggregated[symbol].total += total;
        }
      }
    } catch (err) {
      logError(`fetchBalances: failed for user ${userId} api ${api.exchangeName}`, err);
      totalByExchange.push({ exchange: api.exchangeName, error: err.message });
    }
  }

  // Optionally compute a simple USD-ish aggregated value — omitted because no price feed here.
  return { success: true, totalByExchange, aggregated };
}

/**
 * Fetch open positions and orders for a user.
 * Returns: [{ exchange, openOrders: [...], positions: [...] }]
 */
export async function fetchPositions(userId) {
  const apis = await getUserApis(userId);
  const results = [];

  for (const api of apis) {
    try {
      const client = new BitunixClient({
        apiKey: api.apiKey,
        apiSecret: api.apiSecret,
        type: api.futuresEnabled ? "mix" : "spot",
      });

      // Spot open orders (pending sell/buy orders)
      let openOrders = [];
      try {
        const o = await client.fetchOpenOrders();
        openOrders = Array.isArray(o) ? o : (o?.data?.list ?? []);
      } catch (err) {
        // not fatal — some exchanges may not support this or return different shape
        logError(`fetchPositions: fetchOpenOrders failed for ${api.exchangeName}`, err);
      }

      // Futures / mix positions (if supported)
      let positions = [];
      try {
        if (typeof client.fetchPositions === "function") {
          // some CCXT-style clients have fetchPositions; your BitunixClient didn't implement fetchPositions
          positions = await client.fetchPositions();
        }
      } catch (err) {
        logError(`fetchPositions: fetchPositions failed for ${api.exchangeName}`, err);
      }

      results.push({ exchange: api.exchangeName, openOrders, positions });
    } catch (err) {
      logError(`fetchPositions: Top-level error for ${api.exchangeName} user ${userId}`, err);
      results.push({ exchange: api.exchangeName, error: err.message });
    }
  }

  return { success: true, results };
}

/**
 * getDashboard: convenience wrapper returning balances + positions
 */
export async function getDashboard(userId) {
  const [balances, positions] = await Promise.all([fetchBalances(userId), fetchPositions(userId)]);
  return { balances, positions };
}
