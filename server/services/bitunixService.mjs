import { getExchangeClient } from "./exchangeClients.mjs";
import { info, error as logError } from "../utils/logger.mjs";

// ====================== API Verification ======================
export const verifyUserAPI = async (user) => {
  try {
    const client = getExchangeClient("bitunix", user.apiKey, user.apiSecret, user.type || "spot");
    const result = await client.verifyAPI();

    if (!result.valid) {
      // Log missing permissions to admin dashboard
      logError(`User ${user.id} - Bitunix API verification failed`, result.missingRights || result.error);
      return { success: false, missingRights: result.missingRights || [], error: result.error || null };
    }

    // Show balance & account info on user/admin dashboards
    const balance = await client.fetchBalance();
    info(`User ${user.id} - Bitunix API verified successfully`);
    return { success: true, info: result.info, balance };

  } catch (err) {
    logError(`User ${user.id} - Bitunix API verification error`, err.message || err);
    return { success: false, error: err.message };
  }
};

// ====================== Fetch User Data ======================
export const fetchUserData = async (user) => {
  try {
    const client = getExchangeClient("bitunix", user.apiKey, user.apiSecret, user.type || "spot");
    const balance = await client.fetchBalance();
    const openOrders = await client.fetchOpenOrders();
    return { balance, openOrders };
  } catch (err) {
    logError(`User ${user.id} - Failed fetching Bitunix data`, err.message || err);
    return { balance: null, openOrders: null, error: err.message };
  }
};

// ====================== Execute TradingView Alert ======================
export const executeTradingViewAlert = async (user, { symbol, side, amount, price }) => {
  try {
    const client = getExchangeClient("bitunix", user.apiKey, user.apiSecret, user.type || "spot");
    const order = await client.executeAlert({ symbol, side, amount, price });

    info(`User ${user.id} - Bitunix order executed: ${side} ${symbol} @ ${price}`);
    return { success: true, order };
  } catch (err) {
    logError(`User ${user.id} - Failed executing TradingView alert on Bitunix`, err.message || err);
    return { success: false, error: err.message };
  }
};

// ====================== Close Order ======================
export const closeUserOrder = async (user, orderId) => {
  try {
    const client = getExchangeClient("bitunix", user.apiKey, user.apiSecret, user.type || "spot");
    const result = await client.closeOrder(orderId);

    info(`User ${user.id} - Bitunix order ${orderId} closed`);
    return { success: true, result };
  } catch (err) {
    logError(`User ${user.id} - Failed closing order ${orderId}`, err.message || err);
    return { success: false, error: err.message };
  }
};
