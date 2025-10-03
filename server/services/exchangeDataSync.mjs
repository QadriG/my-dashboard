import client from "../../prisma/client.mjs";
import { getExchangeClient } from "./exchangeClients.mjs";
import { info, error as logError } from "../utils/logger.mjs";
import { sendToUser } from "./websocketService.mjs";
import { decrypt, encrypt } from "../utils/apiencrypt.mjs";

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
          ? ((() => { try { return decrypt(ux.passphrase); } catch { return ux.passphrase; } })())
          : undefined;

        const exchangeClient = getExchangeClient(ux.exchange, apiKey, apiSecret, "spot", passphrase);
        if (!exchangeClient) {
          logError(`${ux.exchange} client creation returned null`);
          continue;
        }

        const balances = await exchangeClient.fetchBalance();
        const openOrders = await exchangeClient.fetchOpenOrders();
        const positions = exchangeClient.has?.fetchPositions
          ? await exchangeClient.fetchPositions()
          : [];

        const exchangeData = { exchange: ux.exchange, balances, openOrders, positions };
        allData.push(exchangeData);

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

export const syncUserExchangesImmediately = async (userId) => {
  try {
    // Delay to ensure database update completes
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