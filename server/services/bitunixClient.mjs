// server/services/bitunixClient.mjs
import fetch from "node-fetch";
import { info, error as logError } from "../utils/logger.mjs";

export class BitunixClient {
  constructor({ apiKey, apiSecret, type = "spot" }) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.type = type.toLowerCase();
    this.baseUrl = "https://api.bitunix.com"; // replace with actual Bitunix API base
  }

  // ====================== Helper ======================
  async request(endpoint, method = "GET", body = null) {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const headers = {
        "API-KEY": this.apiKey,
        "API-SECRET": this.apiSecret,
        "Content-Type": "application/json",
      };

      const options = { method, headers };
      if (body) options.body = JSON.stringify(body);

      const res = await fetch(url, options);
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      return data;
    } catch (err) {
      logError("❌ Bitunix API error", err.message || err);
      throw err;
    }
  }

  // ====================== API Verification ======================
  async verifyAPI() {
    try {
      // Example: fetch account info to check permissions
      const info = await this.request("/account");
      // Validate required rights depending on type (spot/futures)
      const requiredRights = this.type === "spot" ? ["trade", "balance"] : ["trade", "futures"];
      const missingRights = requiredRights.filter(r => !info.permissions?.includes(r));

      if (missingRights.length) {
        return { valid: false, missingRights };
      }

      return { valid: true, info };
    } catch (err) {
      return { valid: false, error: err.message };
    }
  }

  // ====================== Balance ======================
  async fetchBalance() {
    return await this.request("/balance");
  }

  // ====================== Market Data ======================
  async fetchTicker(symbol) {
    return await this.request(`/ticker?symbol=${symbol}`);
  }

  // ====================== Orders ======================
  async fetchOpenOrders(symbol = null) {
    let endpoint = "/orders/open";
    if (symbol) endpoint += `?symbol=${symbol}`;
    return await this.request(endpoint);
  }

  async placeOrder(symbol, side, amount, price) {
    return await this.request("/order", "POST", {
      symbol,
      side,
      amount,
      price,
      type: "limit",
      trade_type: this.type,
    });
  }

  async closeOrder(orderId) {
    return await this.request(`/order/${orderId}/cancel`, "POST");
  }

  // ====================== TradingView Alerts ======================
  async executeAlert({ symbol, side, amount, price }) {
    try {
      const order = await this.placeOrder(symbol, side, amount, price);
      info(`✅ Bitunix ${side} order placed for ${symbol} @ ${price}`);
      return order;
    } catch (err) {
      logError("❌ Failed executing TradingView alert", err.message || err);
      throw err;
    }
  }
}
