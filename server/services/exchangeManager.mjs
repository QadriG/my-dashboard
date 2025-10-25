// services/exchangeManager.mjs
import bybitService from './exchanges/bybitService.mjs';

/**
 * Unified function to fetch exchange data (balance, positions, etc.)
 * Returns normalized data structure
 */
export async function fetchExchangeData(provider, apiKey, apiSecret, passphrase, type) {
  const exchange = provider.toLowerCase();

  if (exchange === 'bybit') {
    const accountType = type === 'spot' ? 'SPOT' : 'UNIFIED';

    // Fetch balance (required)
    const balanceData = await bybitService.fetchBalance(apiKey, apiSecret, accountType);

    // Fetch positions (optional – don't crash if it fails)
    let positionsData = [];
    if (type !== 'spot') {
      try {
        positionsData = await bybitService.fetchPositions(apiKey, apiSecret, accountType);
      } catch (err) {
        console.warn(`[WARN] Failed to fetch Bybit positions: ${err.message}`);
        positionsData = []; // fallback to empty
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
      error: null,
      closePosition: async (symbol, side) => {
        return await bybitService.closePositionByMarket(apiKey, apiSecret, symbol, side);
      }
    };
  }

  throw new Error(`Unsupported exchange: ${provider}`);
}
