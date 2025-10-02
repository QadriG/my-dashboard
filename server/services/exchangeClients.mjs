import ccxt from "ccxt";
import { info, error as logError } from "../utils/logger.mjs";
import { BitunixClient } from "./bitunixClient.mjs";

export const getCCXTClient = (exchange, apiKey, apiSecret, type = "spot", passphrase = null) => {
  try {
    const exchangeId = exchange.toLowerCase();
    let client = null;

    if (exchangeId === "bitunix") {
      try {
        client = new BitunixClient({ apiKey, apiSecret, type });
        info(`Bitunix client created`);
      } catch (err) {
        logError(`Bitunix client creation failed`, err);
        return null;
      }
    } else {
      const options = {};
      if (type === "futures" || type === "future") options.defaultType = "future";
      const creds = { apiKey, secret: apiSecret, password: passphrase || undefined, options };

      if (!(exchangeId in ccxt)) throw new Error(`Unsupported exchange: ${exchange}`);
      client = new ccxt[exchangeId](creds);
      info(`${exchange} ${type} client created`);
    }

    // Clear sensitive variables
    apiKey = null;
    apiSecret = null;
    passphrase = null;

    return client;
  } catch (err) {
    logError(`Exchange client creation failed for ${exchange}`, err);
    return null;
  }
};

export const getExchangeClient = (exchange, apiKey, apiSecret, type = "spot", passphrase = null) => {
  return getCCXTClient(exchange, apiKey, apiSecret, type, passphrase);
};
