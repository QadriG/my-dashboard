// server/services/exchanges/binanceService.mjs

import axios from 'axios';
import crypto from 'crypto';
import { info, warn, error as logError } from "../../utils/logger.mjs"; // Import logging
import { logEvent } from "../../utils/logger.mjs"; // Import logEvent

// ✅ Fixed: removed trailing space
const BASE_URL = 'https://api.binance.com'; // No trailing space

// ✅ Export the sign function for Binance
export function sign(timestamp, apiKey, recvWindow, queryString, secret) {
  const payload = `${timestamp}${apiKey}${recvWindow}${queryString}`;
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Fetch user's balance from Binance
 * @param {string} apiKey - User's Binance API key
 * @param {string} apiSecret - User's Binance API secret
 * @param {string} accountType - Account type ('SPOT', 'FUTURES', etc.)
 * @param {number} userId - The ID of the user whose data is being fetched
 * @returns {Object} Balance data
 */
export async function fetchBalance(apiKey, apiSecret, accountType = 'SPOT', userId) { // ✅ Accept userId
  try {
    const timestamp = Date.now();
    const recvWindow = 60000;

    let url;
    let headers;
    let params;

    if (accountType === 'SPOT') {
      // Binance Spot API endpoint
      url = `${BASE_URL}/api/v3/account`;
      params = new URLSearchParams({
        timestamp: timestamp.toString(),
        recvWindow: recvWindow.toString()
      });
      const queryString = params.toString();

      const signature = sign(timestamp, apiKey, recvWindow, queryString, apiSecret);

      headers = {
        'X-MBX-APIKEY': apiKey,
        'Content-Type': 'application/json'
      };

      // Add signature to query string for Spot
      url += `?${queryString}&signature=${signature}`;

    } else if (accountType === 'FUTURES') {
      // Binance Futures API endpoint
      url = `${BASE_URL}/fapi/v2/account`;
      params = new URLSearchParams({
        timestamp: timestamp.toString(),
        recvWindow: recvWindow.toString()
      });
      const queryString = params.toString();

      const signature = sign(timestamp, apiKey, recvWindow, queryString, apiSecret);

      headers = {
        'X-MBX-APIKEY': apiKey,
        'Content-Type': 'application/json'
      };

      // Add signature to query string for Futures
      url += `?${queryString}&signature=${signature}`;

    } else {
      throw new Error(`Unsupported account type: ${accountType}`);
    }

    const response = await axios.get(url, { headers });

    if (response.data.code !== 0 && response.data.code !== undefined) {
      const errorMsg = `Binance API Error ${response.data.code}: ${response.data.msg || response.data.message}`;
      // ✅ Log error with userId context here
      logError(`[Binance] API Error fetching balance for user ${userId}`, errorMsg, { userId, exchange: 'binance', type: accountType, apiCall: 'getAccount' });
      await logEvent({
        userId, // ✅ Associate log with user
        exchange: 'binance',
        message: `[Binance] API Error fetching balance for user ${userId} (${accountType}): ${errorMsg}`,
        level: "ERROR",
      });
      throw new Error(errorMsg);
    }

    // Process response based on account type
    let balances = {};
    let totalBalance = 0;
    let available = 0;
    let used = 0;

    if (accountType === 'SPOT') {
      // Process Spot balance
      for (const asset of response.data.balances) {
        const assetName = asset.asset;
        const free = parseFloat(asset.free) || 0;
        const locked = parseFloat(asset.locked) || 0;
        const total = free + locked;

        balances[assetName] = {
          free: free,
          used: locked,
          total: total
        };
        totalBalance += total;
        available += free;
        used += locked;
      }
    } else if (accountType === 'FUTURES') {
      // Process Futures balance
      // Binance Futures uses a different structure
      // Example: response.data.totalWalletBalance, response.data.totalUnrealizedProfit
      totalBalance = parseFloat(response.data.totalWalletBalance) || 0;
      // For simplicity, we'll assume totalBalance is the main value
      available = totalBalance; // In Futures, this might be more complex
      used = 0; // Used might not be directly available in Futures

      // If you need to break down by asset, you'd need to process response.data.assets
      // This is a simplified version.
    }

    return {
      success: true,
      balances,
      totalBalance,
      available,
      used
    };
  } catch (err) {
    // ✅ Log error with userId context here (for network issues, etc.)
    logError(`[Binance] Error fetching balance for user ${userId}`, err?.message || err, { userId, exchange: 'binance', type: accountType, apiCall: 'getAccount' });
    await logEvent({
      userId, // ✅ Associate log with user
      exchange: 'binance',
      message: `[Binance] Error fetching balance for user ${userId} (${accountType}): ${err?.message || err}`,
      level: "ERROR",
    });
    // Re-throw or handle as needed
    throw new Error(`Binance fetchBalance failed for user ${userId}: ${err.message}`);
  }
}

/**
 * Fetch user's open positions from Binance
 * @param {string} apiKey - User's Binance API key
 * @param {string} apiSecret - User's Binance API secret
 * @param {string} accountType - Account type ('SPOT', 'FUTURES', etc.)
 * @param {number} userId - The ID of the user whose data is being fetched
 * @returns {Array} List of open positions
 */
export async function fetchPositions(apiKey, apiSecret, accountType = 'FUTURES', userId) { // ✅ Accept userId
  try {
    const timestamp = Date.now();
    const recvWindow = 60000;

    let url;
    let headers;
    let params;

    if (accountType === 'SPOT') {
      // Binance Spot does not have a direct "positions" concept like Futures.
      // You might need to implement logic to calculate positions based on orders and trades.
      // For now, return an empty array or implement a custom logic.
      return [];
    } else if (accountType === 'FUTURES') {
      // Binance Futures API endpoint for positions
      url = `${BASE_URL}/fapi/v2/positionRisk`;
      params = new URLSearchParams({
        timestamp: timestamp.toString(),
        recvWindow: recvWindow.toString()
      });
      const queryString = params.toString();

      const signature = sign(timestamp, apiKey, recvWindow, queryString, apiSecret);

      headers = {
        'X-MBX-APIKEY': apiKey,
        'Content-Type': 'application/json'
      };

      // Add signature to query string for Futures
      url += `?${queryString}&signature=${signature}`;

    } else {
      throw new Error(`Unsupported account type: ${accountType}`);
    }

    const response = await axios.get(url, { headers });

    if (response.data.code !== 0 && response.data.code !== undefined) {
      const errorMsg = `Binance API Error ${response.data.code}: ${response.data.msg || response.data.message}`;
      // ✅ Log error with userId context here
      logError(`[Binance] API Error fetching positions for user ${userId}`, errorMsg, { userId, exchange: 'binance', type: accountType, apiCall: 'getPositionRisk' });
      await logEvent({
        userId, // ✅ Associate log with user
        exchange: 'binance',
        message: `[Binance] API Error fetching positions for user ${userId} (${accountType}): ${errorMsg}`,
        level: "ERROR",
      });
      throw new Error(errorMsg);
    }

    // Process response for Futures positions
    const positions = response.data.map(p => ({
      symbol: p.symbol,
      side: p.positionSide === 'LONG' ? 'buy' : 'sell', // Adjust based on Binance's positionSide
      amount: parseFloat(p.positionAmt), // Position size
      orderValue: (parseFloat(p.positionAmt) * parseFloat(p.entryPrice)).toFixed(2),
      openPrice: parseFloat(p.entryPrice),
      status: 'open',
      openDate: new Date().toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }),
      entryPrice: parseFloat(p.entryPrice),
      size: parseFloat(p.positionAmt),
      unrealizedPnl: parseFloat(p.unRealizedProfit)
    }));

    return positions;
  } catch (err) {
    // ✅ Log error with userId context here (for network issues, etc.)
    logError(`[Binance] Error fetching positions for user ${userId}`, err?.message || err, { userId, exchange: 'binance', type: accountType, apiCall: 'getPositionRisk' });
    await logEvent({
      userId, // ✅ Associate log with user
      exchange: 'binance',
      message: `[Binance] Error fetching positions for user ${userId} (${accountType}): ${err?.message || err}`,
      level: "ERROR",
    });
    // Re-throw or handle as needed
    throw new Error(`Binance fetchPositions failed for user ${userId}: ${err.message}`);
  }
}

/**
 * Close a position on Binance
 * @param {string} apiKey - User's Binance API key
 * @param {string} apiSecret - User's Binance API secret
 * @param {string} symbol - The trading pair (e.g., 'BTCUSDT')
 * @param {string} side - The side of the position to close ('buy' or 'sell')
 * @param {number} userId - The ID of the user whose position is being closed
 * @param {string} category - The category (e.g., 'linear', 'inverse') - Binance Futures doesn't use this directly
 * @param {string} settleCoin - The settlement coin (e.g., 'USDT') - Binance Futures uses this for margin type
 * @returns {Object} Result of the close operation
 */
export async function closePositionByMarket(apiKey, apiSecret, symbol, side, userId, category = 'linear', settleCoin = 'USDT') { // ✅ Accept userId first
  try {
    const timestamp = Date.now();
    const recvWindow = 60000;

    // Determine the opposite side for closing
    const closeSide = side.toLowerCase() === 'buy' ? 'SELL' : 'BUY';

    // For Binance Futures, you need to place an order to close the position
    // This is a simplified example. Real implementation requires more parameters.
    // You might need to fetch the current position size first to place an order of the same size.

    // Example payload for Binance Futures
    const orderPayload = {
      symbol: symbol,
      side: closeSide,
      type: 'MARKET',
      quantity: '1', // You need to determine the correct quantity
      // ... potentially other parameters like reduceOnly: true
    };

    // Construct the URL and headers for Binance Futures
    const url = `${BASE_URL}/fapi/v1/order`;
    const params = new URLSearchParams({
      symbol: symbol,
      side: closeSide,
      type: 'MARKET',
      quantity: '1', // Replace with actual quantity
      timestamp: timestamp.toString(),
      recvWindow: recvWindow.toString()
    });
    const queryString = params.toString();

    const signature = sign(timestamp, apiKey, recvWindow, queryString, apiSecret);

    const headers = {
      'X-MBX-APIKEY': apiKey,
      'Content-Type': 'application/json'
    };

    // Add signature to query string
    const fullUrl = `${url}?${queryString}&signature=${signature}`;

    const response = await axios.post(fullUrl, {}, { headers }); // Empty body for GET-like POST

    if (response.data.code !== 0 && response.data.code !== undefined) {
      const errorMsg = `Binance API Error ${response.data.code}: ${response.data.msg || response.data.message}`;
      // ✅ Log error with userId context here
      logError(`[Binance] API Error closing position for user ${userId}`, errorMsg, { userId, exchange: 'binance', symbol, side, apiCall: 'placeOrder' });
      await logEvent({
        userId, // ✅ Associate log with user
        exchange: 'binance',
        message: `[Binance] API Error closing position for user ${userId} on ${symbol} (${side}): ${errorMsg}`,
        level: "ERROR",
      });
      throw new Error(errorMsg);
    }

    info(`[Binance] Position closed successfully for user ${userId} on ${symbol} (${side})`, { userId, symbol, side, orderId: response.data.orderId }); // Log success with context
    await logEvent({
      userId, // ✅ Associate log with user
      exchange: 'binance',
      message: `[Binance] Position closed successfully for user ${userId} on ${symbol} (${side}), Order ID: ${response.data.orderId}`,
      level: "INFO",
    });

    return {
      success: true,
      message: `Position ${side} for ${symbol} closed successfully via Binance API.`,
      data: response.data
    };
  } catch (err) {
    // ✅ Log error with userId context here (for network issues, etc.)
    logError(`[Binance] Error closing position for user ${userId}`, err?.message || err, { userId, exchange: 'binance', symbol, side, apiCall: 'placeOrder' });
    await logEvent({
      userId, // ✅ Associate log with user
      exchange: 'binance',
      message: `[Binance] Error closing position for user ${userId} on ${symbol} (${side}): ${err?.message || err}`,
      level: "ERROR",
    });
    // Re-throw or handle as needed
    throw new Error(`Failed to close position on Binance for user ${userId}: ${err.message}`);
  }
}

/**
 * Fetch closed trade executions (includes realized PnL)
 * Only for derivatives (Futures); spot not supported here
 */
export async function fetchClosedExecutions(apiKey, apiSecret, category = 'linear', userId) { // ✅ Accept userId
  try {
    const timestamp = Date.now();
    const recvWindow = 60000;

    // Binance Futures API endpoint for closed trades
    const url = `${BASE_URL}/fapi/v1/userTrades`;
    const params = new URLSearchParams({
      symbol: 'BTCUSDT', // You might need to specify the symbol or fetch all
      startTime: (Date.now() - 7 * 24 * 60 * 60 * 1000).toString(), // Last 7 days
      endTime: Date.now().toString(),
      limit: '100',
      timestamp: timestamp.toString(),
      recvWindow: recvWindow.toString()
    });
    const queryString = params.toString();

    const signature = sign(timestamp, apiKey, recvWindow, queryString, apiSecret);

    const headers = {
      'X-MBX-APIKEY': apiKey,
      'Content-Type': 'application/json'
    };

    // Add signature to query string
    const fullUrl = `${url}?${queryString}&signature=${signature}`;

    const response = await axios.get(fullUrl, { headers });

    if (response.data.code !== 0 && response.data.code !== undefined) {
      const errorMsg = `Binance API Error ${response.data.code}: ${response.data.msg || response.data.message}`;
      // ✅ Log error with userId context here
      logError(`[Binance] API Error fetching executions for user ${userId}`, errorMsg, { userId, exchange: 'binance', category, apiCall: 'getUserTrades' });
      await logEvent({
        userId, // ✅ Associate log with user
        exchange: 'binance',
        message: `[Binance] API Error fetching executions for user ${userId} (${category}): ${errorMsg}`,
        level: "ERROR",
      });
      throw new Error(errorMsg);
    }

    const executions = response.data; // Binance returns an array of trades

    return executions.map(exec => {
      // ✅ Validate each field
      if (!exec || !exec.id) {
        warn(`[Binance] Skipping invalid execution for user ${userId}:`, exec, { userId, execId: exec?.id }); // Log with context
        return null;
      }

      return {
        execId: exec.id,
        symbol: exec.symbol,
        side: exec.side.toLowerCase(),
        price: parseFloat(exec.price),
        qty: parseFloat(exec.qty),
        closedPnl: parseFloat(exec.realizedPnl) || 0, // Binance uses 'realizedPnl'
        execTime: parseInt(exec.time),
        fee: parseFloat(exec.fee) || 0,
        execType: exec.type // Binance uses 'type' for order type
      };
    }).filter(Boolean); // ✅ Remove nulls

  } catch (err) {
    // ✅ Log error with userId context here (for network issues, etc.)
    logError(`[Binance] Error fetching executions for user ${userId}`, err?.message || err, { userId, exchange: 'binance', category, apiCall: 'getUserTrades' });
    await logEvent({
      userId, // ✅ Associate log with user
      exchange: 'binance',
      message: `[Binance] Error fetching executions for user ${userId} (${category}): ${err?.message || err}`,
      level: "ERROR",
    });
    // Re-throw or handle as needed
    throw new Error(`Binance fetchClosedExecutions failed for user ${userId}: ${err.message}`);
  }
}

export default {
  fetchBalance,
  fetchPositions,
  closePositionByMarket,
  fetchClosedExecutions
};