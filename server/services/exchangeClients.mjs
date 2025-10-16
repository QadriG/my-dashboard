import ccxt from 'ccxt';

// Cache for exchange clients
const exchangeClients = new Map();

export async function getExchangeClient(exchangeName, apiKey, apiSecret, accountType, passphrase) {
  const cacheKey = `${exchangeName}:${apiKey}:${accountType}`;
  if (exchangeClients.has(cacheKey)) {
    return exchangeClients.get(cacheKey);
  }

  let exchangeClass;
  try {
    exchangeClass = ccxt[exchangeName];
    if (!exchangeClass) {
      throw new Error(`Exchange ${exchangeName} not supported`);
    }
  } catch (err) {
    throw new Error(`Failed to load exchange ${exchangeName}: ${err.message}`);
  }

  const exchangeConfig = {
    apiKey,
    secret: apiSecret,
    enableRateLimit: true,
  };

  if (passphrase) {
    exchangeConfig.password = passphrase;
  }

  // Exchange-specific configurations
  if (exchangeName === 'binance') {
    exchangeConfig.options = { defaultType: accountType };
  } else if (exchangeName === 'binanceusdm') {
    exchangeConfig.options = { defaultType: 'future' };
  } else if (exchangeName === 'okx') {
    exchangeConfig.options = { defaultType: accountType };
  } else if (exchangeName === 'bybit') {
    const bybitExchange = new exchangeClass(exchangeConfig);
    const serverTime = await bybitExchange.fetchTime();
    const localTime = Date.now();
    bybitExchange.options.adjustForTimeDifference = true;
    bybitExchange.options.timeDifference = serverTime - localTime;
    bybitExchange.options.recvWindow = 30000; // 30 seconds tolerance
    bybitExchange.options.defaultType = accountType;
    return bybitExchange;
  } else if (exchangeName === 'coinbase') {
    exchangeConfig.options = { defaultType: 'spot' };
  } else if (exchangeName === 'blofin') {
    exchangeConfig.options = { defaultType: 'future' };
  } else if (exchangeName === 'bitunix') {
    exchangeConfig.options = { defaultType: accountType };
  }

  const exchange = new exchangeClass(exchangeConfig);
  exchangeClients.set(cacheKey, exchange);
  return exchange;
}