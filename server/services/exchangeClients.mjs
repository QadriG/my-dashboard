import ccxt from "ccxt";
import { info, error as logError } from "../utils/logger.mjs";

/**
 * ✅ Create and return a CCXT client for supported exchanges
 * Supports: OKX, Binance, Bybit, Coinbase, Blofin
 */
export const getCCXTClient = (exchange, apiKey, apiSecret, type = "spot", passphrase = null) => {
  try {
    const exchangeId = exchange.toLowerCase();
    let client = null;

    // 🚫 Bitunix disabled for now (requires separate custom client)
    if (exchangeId === "bitunix") {
      logError("Bitunix temporarily disabled – use CCXT-supported exchanges only");
      return null;
    }

    // ✅ Supported exchanges through CCXT
    if (!(exchangeId in ccxt)) {
      throw new Error(`Unsupported exchange: ${exchange}`);
    }

    // --- Configure CCXT client options ---
    const options = {};
    if (type === "futures" || type === "future") options.defaultType = "future";

    const creds = {
      apiKey,
      secret: apiSecret,
      password: passphrase || undefined, // OKX, Coinbase, Bybit
      enableRateLimit: true,
      options,
    };

    // ✅ Create CCXT exchange client
    client = new ccxt[exchangeId](creds);

    info(`${exchange} ${type} client created successfully`);

    // 🧹 Clear sensitive variables
    apiKey = null;
    apiSecret = null;
    passphrase = null;

    return client;
  } catch (err) {
    logError(`❌ Exchange client creation failed for ${exchange}`, err.message || err);
    return null;
  }
};

/**
 * ✅ Wrapper for consistency (future expansion)
 */
export const getExchangeClient = (exchange, apiKey, apiSecret, type = "spot", passphrase = null) => {
  return getCCXTClient(exchange, apiKey, apiSecret, type, passphrase);
};
/**
 * 🔍 Auto-detect whether the provided API keys are for Spot or Futures
 */
export const detectExchangeType = async (exchange, apiKey, apiSecret, passphrase = null) => {
  const exchangeId = exchange.toLowerCase();

  if (!(exchangeId in ccxt)) {
    throw new Error(`Unsupported exchange: ${exchange}`);
  }

  // Try futures first
  try {
    const futuresClient = new ccxt[exchangeId]({
      apiKey,
      secret: apiSecret,
      password: passphrase || undefined,
      enableRateLimit: true,
      options: { defaultType: "future" },
    });

    await futuresClient.loadMarkets();
    if (futuresClient.has["fetchBalance"]) {
      const balance = await futuresClient.fetchBalance();
      if (balance?.info) {
        return "futures";
      }
    }
  } catch (_) {
    // ignore futures failure
  }

  // Fallback to spot
  try {
    const spotClient = new ccxt[exchangeId]({
      apiKey,
      secret: apiSecret,
      password: passphrase || undefined,
      enableRateLimit: true,
      options: { defaultType: "spot" },
    });

    await spotClient.loadMarkets();
    if (spotClient.has["fetchBalance"]) {
      const balance = await spotClient.fetchBalance();
      if (balance?.info) {
        return "spot";
      }
    }
  } catch (err) {
    throw new Error(`Unable to detect exchange type for ${exchange}: ${err.message}`);
  }

  return "spot"; // default fallback
};
