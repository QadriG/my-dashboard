// server/services/exchangeDataSync.mjs
import { PrismaClient } from "@prisma/client";
import { getExchangeClient } from "./exchangeClients.mjs";
import { info, error as logError } from "../utils/logger.mjs";
import { sendToUser } from "./websocketService.mjs";

const prisma = new PrismaClient();

// --- Fetch all data for a single user on all connected exchanges ---
export const fetchUserExchangeData = async (userId) => {
  try {
    const userExchanges = await prisma.userExchange.findMany({ where: { userId } });
    const allData = [];

    for (const ux of userExchanges) {
      try {
        const client = getExchangeClient(
          ux.exchange,
          ux.apiKey,
          ux.apiSecret,
          "spot",
          ux.passphrase
        );

        // Fetch balances
        const balances = await client.fetchBalance();

        // Fetch open orders
        const openOrders = await client.fetchOpenOrders();

        // Fetch positions if supported
        let positions = [];
        if (client.has?.fetchPositions) {
          positions = await client.fetchPositions();
        }

        const exchangeData = {
          exchange: ux.exchange,
          balances,
          openOrders,
          positions,
        };

        allData.push(exchangeData);

        // Push data to user via WebSocket
        sendToUser(userId, { type: "exchangeData", data: exchangeData });
      } catch (err) {
        logError(`Failed fetching data for user ${userId} on ${ux.exchange}`, err);
      }
    }

    return allData;
  } catch (err) {
    logError(`fetchUserExchangeData error for user ${userId}`, err);
    return [];
  }
};

// --- Periodic update for all users ---
export const startPeriodicExchangeSync = (intervalMs = 60_000) => {
  setInterval(async () => {
    try {
      const users = await prisma.user.findMany({ where: { status: "active" } });

      for (const user of users) {
        const data = await fetchUserExchangeData(user.id);

        // Also push a summary to admin dashboard
        // Example: admins get all users’ exchanges
        const adminPayload = {
          type: "userExchangeData",
          userId: user.id,
          exchanges: data,
        };

        // Broadcast to all admins
        const admins = await prisma.user.findMany({ where: { role: "admin" } });
        for (const admin of admins) {
          sendToUser(admin.id, adminPayload);
        }
      }
    } catch (err) {
      logError("Periodic exchange sync error", err);
    }
  }, intervalMs);

  info(`✅ Started periodic exchange data sync every ${intervalMs / 1000}s`);
};

// --- Trigger sync when user saves new API keys ---
export const syncUserExchangesImmediately = async (userId) => {
  const data = await fetchUserExchangeData(userId);

  // Also notify admin immediately
  const adminPayload = {
    type: "userExchangeData",
    userId,
    exchanges: data,
  };

  const admins = await prisma.user.findMany({ where: { role: "admin" } });
  for (const admin of admins) {
    sendToUser(admin.id, adminPayload);
  }
};
