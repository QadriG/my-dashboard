// server/services/exchangeClients.mjs
import ccxt from "ccxt";
import { info, error as logError } from "../utils/logger.mjs";

// ====================== CCXT Factory ======================
export const getCCXTClient = (exchange, apiKey, apiSecret, type = "spot", passphrase = null) => {
  try {
    const exchangeId = exchange.toLowerCase();

    // Map futures support (ccxt uses 'defaultType')
    const options = {};
    if (type === "futures" || type === "future") {
      options.defaultType = "future"; // some exchanges use 'swap' instead
    }

    // Exchange-specific credentials
    const creds = {
      apiKey,
      secret: apiSecret,
      password: passphrase || undefined, // required for OKX, Coinbase, etc.
      options,
    };

    // Dynamically load the exchange
    if (!(exchangeId in ccxt)) {
      throw new Error(`❌ Unsupported exchange: ${exchange}`);
    }

    const client = new ccxt[exchangeId](creds);
    info(`✅ ${exchange} ${type} client created`);
    return client;
  } catch (err) {
    logError(`❌ ${exchange} ${type} client creation failed`, err.message || err);
    throw err;
  }
};

// ====================== Dispatcher ======================
export const getExchangeClient = (exchange, apiKey, apiSecret, type = "spot", passphrase = null) => {
  return getCCXTClient(exchange, apiKey, apiSecret, type, passphrase);
};
