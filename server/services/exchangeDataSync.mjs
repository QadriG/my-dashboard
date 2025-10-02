import client from "../../prisma/client.mjs";
import { getExchangeClient } from "./exchangeClients.mjs";
import { info, error as logError } from "../utils/logger.mjs";
import { sendToUser } from "./websocketService.mjs";
import { decrypt, decrypt as decryptLegacy } from "../utils/apiencrypt.mjs";

// --- Fetch all data for a single user across all exchanges ---
export const fetchUserExchangeData = async (userId) => {
  try {
    const userExchanges = await client.userExchange.findMany({ where: { userId } });
    const allData = [];

    for (const ux of userExchanges) {
      let apiKey, apiSecret, passphrase;

      try {
        if (!ux.apiKey || !ux.apiSecret) {
          logError(`Skipping ${ux.exchange} for user ${userId}: API key/secret missing`);
          continue;
        }

        // Try new decryption, fallback to legacy
        try {
          apiKey = decrypt(ux.apiKey);
          apiSecret = decrypt(ux.apiSecret);
        } catch {
          apiKey = decryptLegacy(ux.apiKey);
          apiSecret = decryptLegacy(ux.apiSecret);
          info(`Used legacy decrypt for user ${userId} on ${ux.exchange}`);
        }

        passphrase = ux.passphrase
          ? ((() => { try { return decrypt(ux.passphrase); } catch { return decryptLegacy(ux.passphrase); } })())
          : undefined;

        const exchangeClient = getExchangeClient(ux.exchange, apiKey, apiSecret, "spot", passphrase);
        if (!exchangeClient) {
          logError(`${ux.exchange} client creation returned null`);
          continue;
        }

        // Fetch data
        const balances = await exchangeClient.fetchBalance();
        const openOrders = await exchangeClient.fetchOpenOrders();
        const positions = exchangeClient.has?.fetchPositions
          ? await exchangeClient.fetchPositions()
          : [];

        const exchangeData = { exchange: ux.exchange, balances, openOrders, positions };
        allData.push(exchangeData);

        // Push to user dashboard via WebSocket
        sendToUser(userId, { type: "exchangeData", data: exchangeData });

      } catch (err) {
        logError(`Failed fetching data for user ${userId} on ${ux.exchange}`, err);
      } finally {
        // Clear sensitive info
        apiKey = apiSecret = passphrase = null;
      }
    }

    return allData;
  } catch (err) {
    logError(`fetchUserExchangeData error for user ${userId}`, err);
    return [];
  }
};

// --- Trigger sync for a specific user (UI action or immediate call) ---
export const syncUserExchangesImmediately = async (userId) => {
  try {
    const data = await fetchUserExchangeData(userId);
    const admins = await client.user.findMany({ where: { role: "admin" } });
    const payload = { type: "userExchangeData", userId, exchanges: data };
    for (const admin of admins) sendToUser(admin.id, payload);
  } catch (err) {
    logError(`syncUserExchangesImmediately error for user ${userId}`, err);
  }
};

// --- Trigger sync for all active users (server startup or periodic) ---
export const syncAllUsersImmediately = async () => {
  try {
    const users = await client.user.findMany({ where: { status: "active" } });
    for (const user of users) {
      await syncUserExchangesImmediately(user.id);
    }
  } catch (err) {
    logError("syncAllUsersImmediately error", err);
  }
};

// --- Periodic sync every N milliseconds ---
export const startPeriodicExchangeSync = (intervalMs = 60_000) => {
  setInterval(syncAllUsersImmediately, intervalMs);
  info(`✅ Started periodic exchange data sync every ${intervalMs / 1000}s`);
};
