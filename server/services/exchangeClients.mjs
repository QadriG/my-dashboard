import Binance from "node-binance-api";

// Bybit (CJS → ESM)
import bybitPkg from "bybit-api";
const { Bybit } = bybitPkg;

// OKX (CJS → ESM)
import okxPkg from "okx-api";
const OKX = okxPkg;

// Coinbase (CJS → ESM)
import * as coinbasePkg from "coinbase-api";
const { Coinbase } = coinbasePkg;


// KuCoin (CJS → ESM)
import kucoinPkg from "kucoin-api";
const { Kucoin } = kucoinPkg;

// BitUnix (CJS → ESM)
import bitunixPkg from "bitunix";
const { Bitunix } = bitunixPkg;

import axios from "axios";
import { info, error as logError } from "../utils/logger.mjs";

// ====================== Binance ======================
export const getBinanceClient = (apiKey, apiSecret, type = "spot") => {
  try {
    const client = new Binance().options({
      APIKEY: apiKey,
      APISECRET: apiSecret,
      useServerTime: true,
      recvWindow: 60000,
    });
    if (type === "futures") client.futures = true;
    info(`✅ Binance ${type} client created`);
    return client;
  } catch (err) {
    logError(`❌ Binance ${type} client creation failed`, err.message || err);
    throw err;
  }
};

// ====================== Bybit ======================
export const getBybitClient = (apiKey, apiSecret, type = "spot") => {
  try {
    const client = new Bybit({
      apiKey,
      apiSecret,
      testnet: false,
    });
    info(`✅ Bybit ${type} client created`);
    return client;
  } catch (err) {
    logError(`❌ Bybit ${type} client creation failed`, err.message || err);
    throw err;
  }
};

// OKX 
export const getOKXClient = (apiKey, apiSecret, passphrase, type = "spot") => {
  try {
    const client = new OKX({ apiKey, apiSecret, passphrase });
    info(`✅ OKX ${type} client created`);
    return client;
  } catch (err) {
    logError(`❌ OKX ${type} client creation failed`, err.message || err);
    throw err;
  }
};

// ====================== Coinbase ======================
export const getCoinbaseClient = (apiKey, apiSecret, passphrase) => {
  try {
    const client = new Coinbase({ apiKey, apiSecret, passphrase });
    info("✅ Coinbase client created");
    return client;
  } catch (err) {
    logError("❌ Coinbase client creation failed", err.message || err);
    throw err;
  }
};

// ====================== KuCoin ======================
export const getKucoinClient = (apiKey, apiSecret, passphrase, type = "spot") => {
  try {
    const client = new Kucoin({
      apiKey,
      secretKey: apiSecret,
      passphrase,
    });
    info(`✅ KuCoin ${type} client created`);
    return client;
  } catch (err) {
    logError(`❌ KuCoin ${type} client creation failed`, err.message || err);
    throw err;
  }
};

// ====================== BitUnix ======================
export const getBitUnixClient = (apiKey, apiSecret, type = "spot") => {
  try {
    const client = new Bitunix({
      apiKey,
      apiSecret,
    });
    info(`✅ BitUnix ${type} client created`);
    return client;
  } catch (err) {
    logError(`❌ BitUnix ${type} client creation failed`, err.message || err);
    throw err;
  }
};

// ====================== Dispatcher ======================
export const getExchangeClient = (exchange, apiKey, apiSecret, type = "spot", passphrase = null) => {
  try {
    switch (exchange.toLowerCase()) {
      case "binance": return getBinanceClient(apiKey, apiSecret, type);
      case "bybit": return getBybitClient(apiKey, apiSecret, type);
      case "okx": return getOKXClient(apiKey, apiSecret, passphrase, type);
      case "coinbase": return getCoinbaseClient(apiKey, apiSecret, passphrase);
      case "kucoin": return getKucoinClient(apiKey, apiSecret, passphrase, type);
      case "bitunix": return getBitUnixClient(apiKey, apiSecret, type);
      default:
        throw new Error(`❌ Unsupported exchange: ${exchange}`);
    }
  } catch (err) {
    logError(`❌ Failed to initialize ${exchange} client`, err.message || err);
    throw err;
  }
};
