// server/services/exchangeManager.mjs

import bybitService from './exchanges/bybitService.mjs';
import binanceService from './exchanges/binanceService.mjs'; // ✅ Import Binance service

/**
 * Unified function to fetch exchange data (balance, positions, etc.)
 * Returns normalized data structure
 * @param {string} provider - The exchange name (e.g., 'bybit', 'binance')
 * @param {string} apiKey - The user's API key
 * @param {string} apiSecret - The user's API secret
 * @param {string|null} passphrase - The user's API passphrase (if needed)
 * @param {string} type - The account type ('spot', 'futures', etc.)
 * @param {number} userId - The ID of the user whose data is being fetched (NEW PARAMETER)
 * @returns {Object} Normalized data structure
 */
export async function fetchExchangeData(provider, apiKey, apiSecret, passphrase, type, userId) { // ✅ Accept userId
  const exchange = provider.toLowerCase();

  if (exchange === 'bybit') {
    const accountType = type === 'spot' ? 'SPOT' : 'UNIFIED';

    const balanceData = await bybitService.fetchBalance(apiKey, apiSecret, accountType, userId); // ✅ Pass userId

    let positionsData = [];
    if (type !== 'spot') {
      try {
        positionsData = await bybitService.fetchPositions(apiKey, apiSecret, accountType, userId); // ✅ Pass userId
      } catch (err) {
        console.warn(`[WARN] Failed to fetch Bybit positions: ${err.message}`);
        positionsData = [];
      }
    }

    let closedExecutions = [];
    if (type !== 'spot') {
      try {
        closedExecutions = await bybitService.fetchClosedExecutions(apiKey, apiSecret, 'linear', userId); // ✅ Pass userId
      } catch (err) {
        console.warn(`[WARN] Failed to fetch Bybit executions: ${err.message}`);
        closedExecutions = [];
      }
    }

    return {
      exchange: 'bybit',
      type,
      balance: {
        totalBalance: balanceData.totalBalance,
        available: balanceData.available,
        used: balanceData.used
      },
      openPositions: positionsData,
      openOrders: [],
      closedExecutions, // ✅
      error: null,
      closePosition: async (symbol, side) => {
        return await bybitService.closePositionByMarket(apiKey, apiSecret, symbol, side, userId); // ✅ Pass userId
      }
    };
  } else if (exchange === 'binance') {
    // Handle Binance
    const accountType = type === 'spot' ? 'SPOT' : 'FUTURES';

    const balanceData = await binanceService.fetchBalance(apiKey, apiSecret, accountType, userId); // ✅ Pass userId

    let positionsData = [];
    if (type !== 'spot') {
      try {
        positionsData = await binanceService.fetchPositions(apiKey, apiSecret, accountType, userId); // ✅ Pass userId
      } catch (err) {
        console.warn(`[WARN] Failed to fetch Binance positions: ${err.message}`);
        positionsData = [];
      }
    }

    let closedExecutions = [];
    if (type !== 'spot') {
      try {
        closedExecutions = await binanceService.fetchClosedExecutions(apiKey, apiSecret, 'linear', userId); // ✅ Pass userId
      } catch (err) {
        console.warn(`[WARN] Failed to fetch Binance executions: ${err.message}`);
        closedExecutions = [];
      }
    }

    return {
      exchange: 'binance',
      type,
      balance: {
        totalBalance: balanceData.totalBalance,
        available: balanceData.available,
        used: balanceData.used
      },
      openPositions: positionsData,
      openOrders: [],
      closedExecutions, // ✅
      error: null,
      closePosition: async (symbol, side) => {
        return await binanceService.closePositionByMarket(apiKey, apiSecret, symbol, side, userId); // ✅ Pass userId
      }
    };
  }

  throw new Error(`Unsupported exchange: ${provider}`);
}