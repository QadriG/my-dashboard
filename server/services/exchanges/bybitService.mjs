// server/services/exchanges/bybitService.mjs

import axios from 'axios';
import crypto from 'crypto';
import { info, warn, error as logError } from "../../utils/logger.mjs"; // Import logging
import { logEvent } from "../../utils/logger.mjs"; // Import logEvent

// ✅ Fixed: removed trailing space
const BASE_URL = 'https://api.bybit.com'; // No trailing space

async function getServerTime() {
  const res = await axios.get(`${BASE_URL}/v5/market/time`);
  return parseInt(res.data.time);
}

// ✅ Export the sign function
export function sign(timestamp, apiKey, recvWindow, queryString, secret) {
  const payload = `${timestamp}${apiKey}${recvWindow}${queryString}`;
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

export async function fetchBalance(apiKey, apiSecret, accountType = 'UNIFIED', userId) { // ✅ Accept userId
  try {
    const serverTime = await getServerTime();
    const timestamp = serverTime;
    const recvWindow = 60000;

    // ✅ Force accountType to 'UNIFIED' as per error message
    const params = new URLSearchParams({
      accountType: 'UNIFIED' // ✅ Hardcoded to 'UNIFIED' as per error
    });
    const queryString = params.toString();

    const signature = sign(timestamp, apiKey, recvWindow, queryString, apiSecret);

    const headers = {
      'X-BAPI-API-KEY': apiKey,
      'X-BAPI-SIGN': signature,
      'X-BAPI-SIGN-TYPE': '2',
      'X-BAPI-TIMESTAMP': timestamp.toString(),
      'X-BAPI-RECV-WINDOW': recvWindow.toString(),
      'Content-Type': 'application/json'
    };

    const url = `${BASE_URL}/v5/account/wallet-balance?${queryString}`;
    const response = await axios.get(url, { headers });

    if (response.data.retCode !== 0) {
      const errorMsg = `Bybit API Error ${response.data.retCode}: ${response.data.retMsg}`;
      // ✅ Log error with userId context here
      logError(`[Bybit] API Error fetching balance for user ${userId}`, errorMsg, { userId, exchange: 'bybit', type: accountType, apiCall: 'getWalletBalance' });
      await logEvent({
        userId, // ✅ Associate log with user
        exchange: 'bybit',
        message: `[Bybit] API Error fetching balance for user ${userId} (${accountType}): ${errorMsg}`,
        level: "ERROR",
      });
      throw new Error(errorMsg);
    }

    const coins = response.data.result.list[0]?.coin || [];
    const balances = {};

    for (const coin of coins) {
      const asset = coin.coin;
      const walletBalance = parseFloat(coin.walletBalance) || 0;
      const available = parseFloat(coin.availableToWithdraw) || 0;
      const used = walletBalance - available;

      balances[asset] = {
        free: available,
        used: used,
        total: walletBalance
      };
    }

    const usdt = balances.USDT || { free: 0, used: 0, total: 0 };
    return {
      success: true,
      balances,
      totalBalance: usdt.total,
      available: usdt.free,
      used: usdt.used
    };
  } catch (err) {
    // ✅ Log error with userId context here (for network issues, etc.)
    logError(`[Bybit] Error fetching balance for user ${userId}`, err?.message || err, { userId, exchange: 'bybit', type: accountType, apiCall: 'getWalletBalance' });
    await logEvent({
      userId, // ✅ Associate log with user
      exchange: 'bybit',
      message: `[Bybit] Error fetching balance for user ${userId} (${accountType}): ${err?.message || err}`,
      level: "ERROR",
    });
    // Re-throw or handle as needed
    throw new Error(`Bybit fetchBalance failed for user ${userId}: ${err.message}`);
  }
}

export async function fetchPositions(apiKey, apiSecret, accountType = 'UNIFIED', userId) { // ✅ Accept userId
  try {
    const serverTime = await getServerTime();
    const timestamp = serverTime;
    const recvWindow = 60000;

    const params = new URLSearchParams({
      category: 'linear',
      settleCoin: 'USDT'
    });
    const queryString = params.toString();

    const signature = sign(timestamp, apiKey, recvWindow, queryString, apiSecret);

    const headers = {
      'X-BAPI-API-KEY': apiKey,
      'X-BAPI-SIGN': signature,
      'X-BAPI-SIGN-TYPE': '2',
      'X-BAPI-TIMESTAMP': timestamp.toString(),
      'X-BAPI-RECV-WINDOW': recvWindow.toString(),
      'Content-Type': 'application/json'
    };

    const url = `${BASE_URL}/v5/position/list?${queryString}`;
    const response = await axios.get(url, { headers });

    if (response.data.retCode !== 0) {
      const errorMsg = `Bybit API Error ${response.data.retCode}: ${response.data.retMsg}`;
      // ✅ Log error with userId context here
      logError(`[Bybit] API Error fetching positions for user ${userId}`, errorMsg, { userId, exchange: 'bybit', type: accountType, apiCall: 'getPositions' });
      await logEvent({
        userId, // ✅ Associate log with user
        exchange: 'bybit',
        message: `[Bybit] API Error fetching positions for user ${userId} (${accountType}): ${errorMsg}`,
        level: "ERROR",
      });
      throw new Error(errorMsg);
    }

    return response.data.result.list.map(p => ({
      symbol: p.symbol,
      side: p.side.toLowerCase(),
      amount: parseFloat(p.size),
      orderValue: (parseFloat(p.size) * parseFloat(p.avgPrice)).toFixed(2),
      openPrice: parseFloat(p.avgPrice),
      status: 'open',
      openDate: new Date(parseInt(p.createdTime)).toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }),
      entryPrice: parseFloat(p.avgPrice),
      size: parseFloat(p.size),
      unrealizedPnl: parseFloat(p.unrealisedPnl)
    }));
  } catch (err) {
    // ✅ Log error with userId context here (for network issues, etc.)
    logError(`[Bybit] Error fetching positions for user ${userId}`, err?.message || err, { userId, exchange: 'bybit', type: accountType, apiCall: 'getPositions' });
    await logEvent({
      userId, // ✅ Associate log with user
      exchange: 'bybit',
      message: `[Bybit] Error fetching positions for user ${userId} (${accountType}): ${err?.message || err}`,
      level: "ERROR",
    });
    // Re-throw or handle as needed
    throw new Error(`Bybit fetchPositions failed for user ${userId}: ${err.message}`);
  }
}

export async function closePositionByMarket(apiKey, apiSecret, symbol, side, userId, category = 'linear', settleCoin = 'USDT') { // ✅ Accept userId first
  try {
    const serverTime = await getServerTime();
    const timestamp = serverTime;
    const recvWindow = 60000;

    const closeSide = side.toLowerCase() === 'buy' ? 'Sell' : 'Buy';

    // Fetch positions using the updated function that accepts userId
    const positions = await fetchPositions(apiKey, apiSecret, 'UNIFIED', userId); // ✅ Pass userId
    const positionToClose = positions.find(p => p.symbol === symbol && p.side.toLowerCase() === side.toLowerCase());

    if (!positionToClose) {
      const errorMsg = `Position to close not found for symbol ${symbol} and side ${side} for user ${userId}`;
      // ✅ Log error with userId context here
      logError(`[Bybit] Position not found for closing`, errorMsg, { userId, exchange: 'bybit', symbol, side, apiCall: 'getPositionsForClose' });
      await logEvent({
        userId, // ✅ Associate log with user
        exchange: 'bybit',
        message: `[Bybit] Position not found for closing for user ${userId} on ${symbol} (${side})`,
        level: "ERROR",
      });
      throw new Error(errorMsg);
    }

    const orderSize = positionToClose.amount; // Use 'amount' as per fetchPositions mapping

    const orderPayload = {
      category,
      symbol,
      side: closeSide,
      orderType: 'Market',
      qty: orderSize.toString(),
      timeInForce: 'IOC',
      reduceOnly: true,
    };

    const queryString = new URLSearchParams(orderPayload).toString();

    const signature = sign(timestamp, apiKey, recvWindow, queryString, apiSecret);

    const headers = {
      'X-BAPI-API-KEY': apiKey,
      'X-BAPI-SIGN': signature,
      'X-BAPI-SIGN-TYPE': '2',
      'X-BAPI-TIMESTAMP': timestamp.toString(),
      'X-BAPI-RECV-WINDOW': recvWindow.toString(),
      'Content-Type': 'application/json'
    };

    const url = `${BASE_URL}/v5/order/create`;
    const response = await axios.post(url, orderPayload, { headers });

    if (response.data.retCode !== 0) {
      const errorMsg = `Bybit API Error ${response.data.retCode}: ${response.data.retMsg}`;
      // ✅ Log error with userId context here
      logError(`[Bybit] API Error closing position for user ${userId}`, errorMsg, { userId, exchange: 'bybit', symbol, side, apiCall: 'placeOrder' });
      await logEvent({
        userId, // ✅ Associate log with user
        exchange: 'bybit',
        message: `[Bybit] API Error closing position for user ${userId} on ${symbol} (${side}): ${errorMsg}`,
        level: "ERROR",
      });
      throw new Error(errorMsg);
    }

    info(`[Bybit] Position closed successfully for user ${userId} on ${symbol} (${side})`, { userId, symbol, side, orderId: response.data.result.orderId }); // Log success with context
    await logEvent({
      userId, // ✅ Associate log with user
      exchange: 'bybit',
      message: `[Bybit] Position closed successfully for user ${userId} on ${symbol} (${side}), Order ID: ${response.data.result.orderId}`,
      level: "INFO",
    });

    return {
      success: true,
      message: `Position ${side} for ${symbol} closed successfully via Bybit API.`,
      data: response.data.result
    };
  } catch (err) {
    // ✅ Log error with userId context here (for network issues, etc.)
    logError(`[Bybit] Error closing position for user ${userId}`, err?.message || err, { userId, exchange: 'bybit', symbol, side, apiCall: 'placeOrder' });
    await logEvent({
      userId, // ✅ Associate log with user
      exchange: 'bybit',
      message: `[Bybit] Error closing position for user ${userId} on ${symbol} (${side}): ${err?.message || err}`,
      level: "ERROR",
    });
    // Re-throw or handle as needed
    throw new Error(`Failed to close position on Bybit for user ${userId}: ${err.message}`);
  }
}

/**
 * Fetch closed trade executions (includes realized PnL)
 * Only for derivatives (linear/inverse); spot not supported here
 */
export async function fetchClosedExecutions(apiKey, apiSecret, category = 'linear', userId) { // ✅ Accept userId
  try {
    const serverTime = await getServerTime();
    const timestamp = serverTime;
    const recvWindow = 60000;

    // Fetch executions from last 7 days
    const endTime = serverTime;
    const startTime = endTime - 7 * 24 * 60 * 60 * 1000;

    const params = new URLSearchParams({
      category,
      startTime: startTime.toString(),
      endTime: endTime.toString(),
      limit: '100'
    });
    const queryString = params.toString();

    const signature = sign(timestamp, apiKey, recvWindow, queryString, apiSecret);

    const headers = {
      'X-BAPI-API-KEY': apiKey,
      'X-BAPI-SIGN': signature,
      'X-BAPI-SIGN-TYPE': '2',
      'X-BAPI-TIMESTAMP': timestamp.toString(),
      'X-BAPI-RECV-WINDOW': recvWindow.toString(),
      'Content-Type': 'application/json'
    };

    const url = `${BASE_URL}/v5/execution/list?${queryString}`;
    const response = await axios.get(url, { headers });

    if (response.data.retCode !== 0) {
      const errorMsg = `Bybit API Error ${response.data.retCode}: ${response.data.retMsg}`;
      // ✅ Log error with userId context here
      logError(`[Bybit] API Error fetching executions for user ${userId}`, errorMsg, { userId, exchange: 'bybit', category, apiCall: 'getExecutionList' });
      await logEvent({
        userId, // ✅ Associate log with user
        exchange: 'bybit',
        message: `[Bybit] API Error fetching executions for user ${userId} (${category}): ${errorMsg}`,
        level: "ERROR",
      });
      throw new Error(errorMsg);
    }

    const executions = response.data.result?.list || []; // ✅ Add ? for safety

    return executions.map(exec => {
      // ✅ Validate each field
      if (!exec || !exec.execId) {
        warn(`[Bybit] Skipping invalid execution for user ${userId}:`, exec, { userId, execId: exec?.execId }); // Log with context
        return null;
      }

      return {
        execId: exec.execId,
        symbol: exec.symbol,
        side: exec.side.toLowerCase(),
        price: parseFloat(exec.execPrice),
        qty: parseFloat(exec.execQty),
        closedPnl: parseFloat(exec.closedPnl || 0),
        execTime: parseInt(exec.execTime),
        fee: parseFloat(exec.fee || 0),
        execType: exec.execType
      };
    }).filter(Boolean); // ✅ Remove nulls

  } catch (err) {
    // ✅ Log error with userId context here (for network issues, etc.)
    logError(`[Bybit] Error fetching executions for user ${userId}`, err?.message || err, { userId, exchange: 'bybit', category, apiCall: 'getExecutionList' });
    await logEvent({
      userId, // ✅ Associate log with user
      exchange: 'bybit',
      message: `[Bybit] Error fetching executions for user ${userId} (${category}): ${err?.message || err}`,
      level: "ERROR",
    });
    // Re-throw or handle as needed
    throw new Error(`Bybit fetchClosedExecutions failed for user ${userId}: ${err.message}`);
  }
}

export default {
  fetchBalance,
  fetchPositions,
  closePositionByMarket,
  fetchClosedExecutions
};