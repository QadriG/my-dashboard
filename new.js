import client from "./prisma/client.mjs";
import { getExchangeClient } from "./server/services/exchangeClients.mjs";
import { info, error as logError } from "./server/utils/logger.mjs";
import { sendToUser } from "./server/services/websocketService.mjs";
import { decrypt, encrypt } from "./server/utils/apiencrypt.mjs";

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

        // Decrypt or re-encrypt if plain text
        try {
          apiKey = decrypt(ux.apiKey);
          apiSecret = decrypt(ux.apiSecret);
        } catch (decErr) {
          if (decErr.message.includes("Invalid encrypted data format")) {
            info(`Detected plain text for user ${userId} on ${ux.exchange}, re-encrypting`);
            apiKey = ux.apiKey;
            apiSecret = ux.apiSecret;
            await client.userExchange.update({
              where: { id: ux.id },
              data: { apiKey: encrypt(apiKey), apiSecret: encrypt(apiSecret) },
            });
            apiKey = decrypt(encrypt(apiKey));
            apiSecret = decrypt(encrypt(apiSecret));
          } else {
            throw decErr;
          }
        }

        passphrase = ux.passphrase
          ? (() => { try { return decrypt(ux.passphrase); } catch { return ux.passphrase; } })()
          : undefined;

        // Create client
        const exchangeClient = getExchangeClient(ux.exchange, apiKey, apiSecret, ux.type || "spot", passphrase);
        if (!exchangeClient) {
          logError(`${ux.exchange} client creation returned null`);
          continue;
        }

        // Fetch balances
        const balances = await exchangeClient.fetchBalance();

        // Fetch open orders for spot and futures (if supported)
        let openOrders = [];
        try {
          if (exchangeClient.fetchOpenOrders) {
            const spotOrders = await exchangeClient.fetchOpenOrders();
            openOrders = spotOrders.length ? spotOrders : 0;
          }
          // Futures open orders (if supported by client)
          if (exchangeClient.type !== "spot" && exchangeClient.fetchOpenOrders) {
            const futuresOrders = await exchangeClient.fetchOpenOrders();
            openOrders = Array.isArray(openOrders) ? openOrders.concat(futuresOrders) : futuresOrders.length ? futuresOrders : 0;
          }
        } catch (err) {
          logError(`Error fetching open orders for user ${userId} on ${ux.exchange}`, err);
          openOrders = 0;
        }

        // Fetch positions if available
        const positions = exchangeClient.has?.fetchPositions
          ? await exchangeClient.fetchPositions()
          : [];

        const exchangeData = { exchange: ux.exchange, balances, openOrders, positions };
        allData.push(exchangeData);

        // Send real-time update
        sendToUser(userId, { type: "exchangeData", data: exchangeData });

      } catch (err) {
        logError(`Failed fetching data for user ${userId} on ${ux.exchange}`, err);
      } finally {
        apiKey = apiSecret = passphrase = null;
      }
    }

    return allData;
  } catch (err) {
    logError(`fetchUserExchangeData error for user ${userId}`, err);
    return [];
  }
};

// ================= Sync helpers =================
export const syncUserExchangesImmediately = async (userId) => {
  try {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const data = await fetchUserExchangeData(userId);
    const admins = await client.user.findMany({ where: { role: "admin" } });
    const payload = { type: "userExchangeData", userId, exchanges: data };
    for (const admin of admins) sendToUser(admin.id, payload);
  } catch (err) {
    logError(`syncUserExchangesImmediately error for user ${userId}`, err);
  }
};

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

export const startPeriodicExchangeSync = (intervalMs = 60_000) => {
  setInterval(syncAllUsersImmediately, intervalMs);
  info(`✅ Started periodic exchange data sync every ${intervalMs / 1000}s`);
};
