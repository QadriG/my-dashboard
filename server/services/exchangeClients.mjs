import ccxt from "ccxt";
import { info, error as logError } from "../utils/logger.mjs";
import { BitunixClient } from "./bitunixClient.mjs";

// ====================== CCXT Factory ======================
export const getCCXTClient = (exchange, apiKey, apiSecret, type = "spot", passphrase = null) => {
  try {
    const exchangeId = exchange.toLowerCase();

    if (exchangeId === "bitunix") {
      const client = new BitunixClient({ apiKey, apiSecret, type });
      info(`✅ ${exchange} client created`);
      return client;
    }

    const options = {};
    if (type === "futures" || type === "future") options.defaultType = "future";

    const creds = { apiKey, secret: apiSecret, password: passphrase || undefined, options };

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
