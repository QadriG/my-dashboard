// services/exchanges/bybitService.mjs
import axios from 'axios';
import crypto from 'crypto';

const BASE_URL = 'https://api.bybit.com'; // Removed trailing space

async function getServerTime() {
  const res = await axios.get(`${BASE_URL}/v5/market/time`);
  return parseInt(res.data.time);
}

function sign(timestamp, apiKey, recvWindow, queryString, secret) {
  const payload = `${timestamp}${apiKey}${recvWindow}${queryString}`;
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

export async function fetchBalance(apiKey, apiSecret, accountType = 'UNIFIED') {
  try {
    const serverTime = await getServerTime();
    const timestamp = serverTime;
    const recvWindow = 60000;

    const params = new URLSearchParams({
      accountType: accountType.toUpperCase()
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
      throw new Error(`Bybit API Error ${response.data.retCode}: ${response.data.retMsg}`);
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
    throw new Error(`Bybit fetchBalance failed: ${err.message}`);
  }
}

export async function fetchPositions(apiKey, apiSecret, accountType = 'UNIFIED') {
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
      throw new Error(`Bybit API Error ${response.data.retCode}: ${response.data.retMsg}`);
    }

    return response.data.result.list.map(p => ({
      symbol: p.symbol,
      side: p.side.toLowerCase(),
      amount: parseFloat(p.size),
      orderValue: (parseFloat(p.size) * parseFloat(p.avgPrice)).toFixed(2),
      openPrice: parseFloat(p.avgPrice),
      status: 'open',
      // ✅ FIX: Use createdTime instead of openTime
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
    throw new Error(`Bybit fetchPositions failed: ${err.message}`);
  }
}

// --- New Function: Close Position by Market Order ---
export async function closePositionByMarket(apiKey, apiSecret, symbol, side, category = 'linear', settleCoin = 'USDT') {
  try {
    const serverTime = await getServerTime();
    const timestamp = serverTime;
    const recvWindow = 60000;

    // Determine the closing side (opposite of the current position side)
    const closeSide = side.toLowerCase() === 'buy' ? 'Sell' : 'Buy';

    // Fetch the current position to get its size
    const positions = await fetchPositions(apiKey, apiSecret, 'UNIFIED'); // Assuming UNIFIED account type for futures
    const positionToClose = positions.find(p => p.symbol === symbol && p.side.toLowerCase() === side.toLowerCase());

    if (!positionToClose) {
      throw new Error(`Position to close not found for symbol ${symbol} and side ${side}`);
    }

    const orderSize = positionToClose.size; // Use the current position size

    // Prepare the order payload
    const orderPayload = {
      category,
      symbol,
      side: closeSide,
      orderType: 'Market',
      qty: orderSize.toString(),
      timeInForce: 'IOC', // Or 'FOK' depending on preference
      reduceOnly: true, // Crucial for closing existing positions
    };

    const queryString = new URLSearchParams(orderPayload).toString();

    // Sign the request
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
      throw new Error(`Bybit API Error ${response.data.retCode}: ${response.data.retMsg}`);
    }

    // Return success message or relevant data from the API response
    return {
      success: true,
      message: `Position ${side} for ${symbol} closed successfully via Bybit API.`,
      data: response.data.result // Include API response data if needed
    };

  } catch (err) {
    console.error(`Error closing position on Bybit:`, err.message);
    throw new Error(`Failed to close position on Bybit: ${err.message}`);
  }
}

export default { fetchBalance, fetchPositions, closePositionByMarket };
