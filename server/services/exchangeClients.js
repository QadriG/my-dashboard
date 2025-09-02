// server/services/exchangeClients.js
import Binance from "node-binance-api";
import { SpotClient } from "@bybit-exchange/api"; // example if using Bybit official SDK

/**
 * Create a client for Binance
 * @param {string} apiKey
 * @param {string} apiSecret
 * @returns Binance client instance
 */
export const getBinanceClient = (apiKey, apiSecret) => {
  const client = new Binance().options({
    APIKEY: apiKey,
    APISECRET: apiSecret,
    useServerTime: true,
    recvWindow: 60000,
  });
  return client;
};

/**
 * Create a client for Bybit
 * @param {string} apiKey
 * @param {string} apiSecret
 * @returns Bybit client instance
 */
export const getBybitClient = (apiKey, apiSecret) => {
  const client = new SpotClient({
    key: apiKey,
    secret: apiSecret,
  });
  return client;
};

/**
 * Generic function to get exchange client by name
 * @param {string} exchange - e.g., "Binance", "Bybit"
 * @param {string} apiKey
 * @param {string} apiSecret
 * @returns exchange client instance
 */
export const getExchangeClient = (exchange, apiKey, apiSecret) => {
  switch (exchange.toLowerCase()) {
    case "binance":
      return getBinanceClient(apiKey, apiSecret);
    case "bybit":
      return getBybitClient(apiKey, apiSecret);
    default:
      throw new Error(`Unsupported exchange: ${exchange}`);
  }
};
