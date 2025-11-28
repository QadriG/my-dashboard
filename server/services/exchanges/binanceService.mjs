// server/services/exchanges/binanceService.mjs

import axios from 'axios';
import crypto from 'crypto';
import { info, warn, error as logError } from "../../utils/logger.mjs";
import { logEvent } from "../../utils/logger.mjs";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const debugLogPath = path.join(__dirname, '..', '..', 'logs', 'binance_debug.log');

const logsDir = path.dirname(debugLogPath);
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

const appendDebugLog = (message) => {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    fs.appendFileSync(debugLogPath, logEntry);
};

// ✅ FIXED: Removed trailing spaces from all base URLs
const SPOT_BASE_URL = 'https://api.binance.com';
const FUTURES_BASE_URL = 'https://fapi.binance.com';
const COIN_FUTURES_BASE_URL = 'https://dapi.binance.com';

/**
 * Sign request for Binance API
 */
export function sign(queryString, secret, endpointType = 'spot') {
  return crypto.createHmac('sha256', secret).update(queryString).digest('hex');
}

/**
 * Fetch user's balance from Binance
 */
export async function fetchBalance(apiKey, apiSecret, accountType = 'SPOT', userId) {
  try {
    const timestamp = Date.now();
    const recvWindow = 60000;

    let baseUrl;
    let url;
    let headers;
    let params;

    if (accountType === 'SPOT') {
      baseUrl = SPOT_BASE_URL;
      url = `${baseUrl}/api/v3/account`;
      params = new URLSearchParams({
        timestamp: timestamp.toString(),
        recvWindow: recvWindow.toString()
      });
      const queryString = params.toString();
      const signature = sign(queryString, apiSecret, 'spot');
      url += `?${queryString}&signature=${signature}`;
      
    } else if (accountType === 'FUTURES') {
      baseUrl = FUTURES_BASE_URL;
      url = `${baseUrl}/fapi/v2/account`;
      params = new URLSearchParams({
        timestamp: timestamp.toString(),
        recvWindow: recvWindow.toString()
      });
      const queryString = params.toString();
      const signature = sign(queryString, apiSecret, 'futures');
      url += `?${queryString}&signature=${signature}`;
      
    } else if (accountType === 'COIN_FUTURES') {
      baseUrl = COIN_FUTURES_BASE_URL;
      url = `${baseUrl}/dapi/v1/account`;
      params = new URLSearchParams({
        timestamp: timestamp.toString(),
        recvWindow: recvWindow.toString()
      });
      const queryString = params.toString();
      const signature = sign(queryString, apiSecret, 'futures');
      url += `?${queryString}&signature=${signature}`;
      
    } else {
      throw new Error(`Unsupported account type: ${accountType}`);
    }

    headers = {
      'X-MBX-APIKEY': apiKey,
      'Content-Type': 'application/json'
    };

    const debugUrlMessage = `[DEBUG] Fetching balance from: ${url}`;
    appendDebugLog(debugUrlMessage);

    const response = await axios.get(url, { 
      headers,
      timeout: 10000
    });

    const debugStatusMessage = `[DEBUG] Balance response status: ${response.status}`;
    appendDebugLog(debugStatusMessage);

    if (response.data.code !== 0 && response.data.code !== undefined) {
      const errorMsg = `Binance API Error ${response.data.code}: ${response.data.msg || response.data.message}`;
      logError(`[Binance] API Error fetching balance for user ${userId}`, errorMsg, { userId, exchange: 'binance', type: accountType, apiCall: 'getAccount' });
      await logEvent({
        userId,
        exchange: 'binance',
        message: `[Binance] API Error fetching balance for user ${userId} (${accountType}): ${errorMsg}`,
        level: "ERROR",
      });
      throw new Error(errorMsg);
    }

    const rawBalanceLog = `[DEBUG] Raw balance response: ${JSON.stringify(response.data, null, 2)}`;
    appendDebugLog(rawBalanceLog);

    let balances = {};
    let totalBalance = 0;
    let available = 0;
    let used = 0;

    if (accountType === 'SPOT') {
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
    } else if (accountType === 'FUTURES' || accountType === 'COIN_FUTURES') {
      totalBalance = parseFloat(response.data.totalWalletBalance) || 0;
      available = parseFloat(response.data.totalAvailableBalance) || 0;
      used = totalBalance - available;
    }

    const processedBalanceLog = `[DEBUG] Processed balance: ${JSON.stringify({ totalBalance, available, used }, null, 2)}`;
    appendDebugLog(processedBalanceLog);

    return {
      success: true,
      balances,
      totalBalance,
      available,
      used
    };
  } catch (err) {
    console.error(`[ERROR] Binance fetchBalance error for user ${userId}:`, err?.response?.data || err.message);
    
    logError(`[Binance] Error fetching balance for user ${userId}`, err?.message || err, { userId, exchange: 'binance', type: accountType, apiCall: 'getAccount' });
    await logEvent({
      userId,
      exchange: 'binance',
      message: `[Binance] Error fetching balance for user ${userId} (${accountType}): ${err?.message || err}`,
      level: "ERROR",
    });
    throw new Error(`Binance fetchBalance failed for user ${userId}: ${err.message}`);
  }
}

/**
 * Fetch user's open positions from Binance
 */
export async function fetchPositions(apiKey, apiSecret, accountType = 'FUTURES', userId) {
  try {
    const timestamp = Date.now();
    const recvWindow = 60000;

    let baseUrl;
    let url;
    let headers;
    let params;

    if (accountType === 'SPOT') {
      return [];
    } else if (accountType === 'FUTURES') {
      baseUrl = FUTURES_BASE_URL;
      url = `${baseUrl}/fapi/v2/positionRisk`;
      params = new URLSearchParams({
        timestamp: timestamp.toString(),
        recvWindow: recvWindow.toString()
      });
      const queryString = params.toString();
      const signature = sign(queryString, apiSecret, 'futures');
      url += `?${queryString}&signature=${signature}`;
      
    } else if (accountType === 'COIN_FUTURES') {
      baseUrl = COIN_FUTURES_BASE_URL;
      url = `${baseUrl}/dapi/v1/positionRisk`;
      params = new URLSearchParams({
        timestamp: timestamp.toString(),
        recvWindow: recvWindow.toString()
      });
      const queryString = params.toString();
      const signature = sign(queryString, apiSecret, 'futures');
      url += `?${queryString}&signature=${signature}`;
      
    } else {
      throw new Error(`Unsupported account type: ${accountType}`);
    }

    headers = {
      'X-MBX-APIKEY': apiKey,
      'Content-Type': 'application/json'
    };

    const debugPositionsUrlMessage = `[DEBUG] Fetching positions from: ${url}`;
    appendDebugLog(debugPositionsUrlMessage);

    const response = await axios.get(url, { headers });

    const debugPositionsStatusMessage = `[DEBUG] Positions response status: ${response.status}`;
    appendDebugLog(debugPositionsStatusMessage);

    if (response.data.code !== 0 && response.data.code !== undefined) {
      const errorMsg = `Binance API Error ${response.data.code}: ${response.data.msg || response.data.message}`;
      logError(`[Binance] API Error fetching positions for user ${userId}`, errorMsg, { userId, exchange: 'binance', type: accountType, apiCall: 'getPositionRisk' });
      await logEvent({
        userId,
        exchange: 'binance',
        message: `[Binance] API Error fetching positions for user ${userId} (${accountType}): ${errorMsg}`,
        level: "ERROR",
      });
      throw new Error(errorMsg);
    }

    const rawPositionsLog = `[DEBUG] Raw positions response: ${JSON.stringify(response.data, null, 2)}`;
    appendDebugLog(rawPositionsLog);

    const positions = response.data
      .filter(p => parseFloat(p.positionAmt) !== 0)
      .map(p => ({
        symbol: p.symbol,
        side: parseFloat(p.positionAmt) > 0 ? 'buy' : 'sell',
        amount: Math.abs(parseFloat(p.positionAmt)),
        orderValue: (Math.abs(parseFloat(p.positionAmt)) * parseFloat(p.entryPrice)).toFixed(2),
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
        size: Math.abs(parseFloat(p.positionAmt)),
        unrealizedPnl: parseFloat(p.unRealizedProfit)
      }));

    const processedPositionsLog = `[DEBUG] Processed positions: ${JSON.stringify(positions, null, 2)}`;
    appendDebugLog(processedPositionsLog);

    return positions;
  } catch (err) {
    console.error(`[ERROR] Binance fetchPositions error for user ${userId}:`, err?.response?.data || err.message);
    
    logError(`[Binance] Error fetching positions for user ${userId}`, err?.message || err, { userId, exchange: 'binance', type: accountType, apiCall: 'getPositionRisk' });
    await logEvent({
      userId,
      exchange: 'binance',
      message: `[Binance] Error fetching positions for user ${userId} (${accountType}): ${err?.message || err}`,
      level: "ERROR",
    });
    throw new Error(`Binance fetchPositions failed for user ${userId}: ${err.message}`);
  }
}

/**
 * Close a position on Binance
 */
export async function closePositionByMarket(apiKey, apiSecret, symbol, side, userId, category = 'linear', settleCoin = 'USDT') {
  try {
    const timestamp = Date.now();
    const recvWindow = 60000;

    const closeSide = side.toLowerCase() === 'buy' ? 'SELL' : 'BUY';

    const baseUrl = FUTURES_BASE_URL;
    const url = `${baseUrl}/fapi/v1/order`;
    const params = new URLSearchParams({
      symbol: symbol,
      side: closeSide,
      type: 'MARKET',
      quantity: '1',
      reduceOnly: 'true',
      timestamp: timestamp.toString(),
      recvWindow: recvWindow.toString()
    });
    const queryString = params.toString();
    const signature = sign(queryString, apiSecret, 'futures');

    const headers = {
      'X-MBX-APIKEY': apiKey,
      'Content-Type': 'application/json'
    };

    const fullUrl = `${url}?${queryString}&signature=${signature}`;

    const response = await axios.post(fullUrl, {}, { headers });

    if (response.data.code !== 0 && response.data.code !== undefined) {
      const errorMsg = `Binance API Error ${response.data.code}: ${response.data.msg || response.data.message}`;
      logError(`[Binance] API Error closing position for user ${userId}`, errorMsg, { userId, exchange: 'binance', symbol, side, apiCall: 'placeOrder' });
      await logEvent({
        userId,
        exchange: 'binance',
        message: `[Binance] API Error closing position for user ${userId} on ${symbol} (${side}): ${errorMsg}`,
        level: "ERROR",
      });
      throw new Error(errorMsg);
    }

    info(`[Binance] Position closed successfully for user ${userId} on ${symbol} (${side})`, { userId, symbol, side, orderId: response.data.orderId });
    await logEvent({
      userId,
      exchange: 'binance',
      message: `[Binance] Position closed successfully for user ${userId} on ${symbol} (${side}), Order ID: ${response.data.orderId}`,
      level: "INFO",
    });

    return {
      success: true,
      message: `Position ${side} for ${symbol} closed successfully via Binance API.`,
      response_data: response.data // ✅ CORRECTED: Added colon and property name
    };
  } catch (err) {
    console.error(`[ERROR] Binance closePosition error for user ${userId}:`, err?.response?.data || err.message);
    
    logError(`[Binance] Error closing position for user ${userId}`, err?.message || err, { userId, exchange: 'binance', symbol, side, apiCall: 'placeOrder' });
    await logEvent({
      userId,
      exchange: 'binance',
      message: `[Binance] Error closing position for user ${userId} on ${symbol} (${side}): ${err?.message || err}`,
      level: "ERROR",
    });
    throw new Error(`Failed to close position on Binance for user ${userId}: ${err.message}`);
  }
}

/**
 * Fetch closed trade executions (includes realized PnL)
 */
export async function fetchClosedExecutions(apiKey, apiSecret, category = 'linear', userId) {
  try {
    const timestamp = Date.now();
    const recvWindow = 60000;

    const baseUrl = FUTURES_BASE_URL;
    const url = `${baseUrl}/fapi/v1/userTrades`;
    const params = new URLSearchParams({
      limit: '100',
      timestamp: timestamp.toString(),
      recvWindow: recvWindow.toString()
    });
    const queryString = params.toString();
    const signature = sign(queryString, apiSecret, 'futures');

    const headers = {
      'X-MBX-APIKEY': apiKey,
      'Content-Type': 'application/json'
    };

    const fullUrl = `${url}?${queryString}&signature=${signature}`;

    const response = await axios.get(fullUrl, { headers });

    if (response.data.code !== 0 && response.data.code !== undefined) {
      const errorMsg = `Binance API Error ${response.data.code}: ${response.data.msg || response.data.message}`;
      logError(`[Binance] API Error fetching executions for user ${userId}`, errorMsg, { userId, exchange: 'binance', category, apiCall: 'getUserTrades' });
      await logEvent({
        userId,
        exchange: 'binance',
        message: `[Binance] API Error fetching executions for user ${userId} (${category}): ${errorMsg}`,
        level: "ERROR",
      });
      throw new Error(errorMsg);
    }

    const rawExecutionsLog = `[DEBUG] Raw executions response: ${JSON.stringify(response.data, null, 2)}`;
    appendDebugLog(rawExecutionsLog);

    const executions = response.data;

    const processedExecutions = executions.map(exec => {
      if (!exec || !exec.id) {
        warn(`[Binance] Skipping invalid execution for user ${userId}:`, exec, { userId, execId: exec?.id });
        return null;
      }

      return {
        execId: exec.id,
        symbol: exec.symbol,
        side: exec.side.toLowerCase(),
        price: parseFloat(exec.price),
        qty: parseFloat(exec.qty),
        closedPnl: parseFloat(exec.realizedPnL) || 0,
        execTime: parseInt(exec.time),
        fee: parseFloat(exec.fee) || 0,
        execType: exec.type
      };
    }).filter(Boolean);

    const processedExecutionsLog = `[DEBUG] Processed executions: ${JSON.stringify(processedExecutions, null, 2)}`;
    appendDebugLog(processedExecutionsLog);

    return processedExecutions;

  } catch (err) {
    console.error(`[ERROR] Binance fetchClosedExecutions error for user ${userId}:`, err?.response?.data || err.message);
    
    logError(`[Binance] Error fetching executions for user ${userId}`, err?.message || err, { userId, exchange: 'binance', category, apiCall: 'getUserTrades' });
    await logEvent({
      userId,
      exchange: 'binance',
      message: `[Binance] Error fetching executions for user ${userId} (${category}): ${err?.message || err}`,
      level: "ERROR",
    });
    throw new Error(`Binance fetchClosedExecutions failed for user ${userId}: ${err.message}`);
  }
}

export default {
  fetchBalance,
  fetchPositions,
  closePositionByMarket,
  fetchClosedExecutions
};