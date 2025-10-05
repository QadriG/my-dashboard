// server/services/bitunixClient.mjs
import crypto from "crypto";
import fetch from "node-fetch";
import { info, error as logError } from "../utils/logger.mjs";

export class BitunixClient {
  constructor({ apiKey, apiSecret, type = "spot" }) {
    if (!apiKey || !apiSecret) throw new Error("API key or secret missing");

    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.type = type.toLowerCase(); // "spot", "mix", "futures"
    this.baseUrl = "https://openapi.bitunix.com";

    info(`BitunixClient initialized with provided credentials for ${type}`);
  }

  generateSign({ nonce, timestamp, queryParams = "", body = "" }) {
    const digest = crypto
      .createHash("sha256")
      .update(nonce + timestamp + this.apiKey + queryParams + body)
      .digest("hex");
    return crypto
      .createHash("sha256")
      .update(digest + this.apiSecret)
      .digest("hex");
  }

  async request(endpoint, method = "GET", params = {}, body = null) {
    try {
      const timestamp = Date.now().toString();
      const nonce = crypto.randomBytes(16).toString("hex");

      const bodyStr = body ? JSON.stringify(body) : "";
      const queryParams = method.toUpperCase() === "GET" && Object.keys(params).length
        ? new URLSearchParams(params).toString()
        : "";

      const sign = this.generateSign({ nonce, timestamp, queryParams, body: bodyStr });
      const url = `${this.baseUrl}${endpoint}${queryParams ? "?" + queryParams : ""}`;
      const options = {
        method,
        headers: {
          "api-key": this.apiKey,
          nonce,
          timestamp,
          sign,
          "Content-Type": "application/json",
        },
      };
      if (bodyStr && method.toUpperCase() !== "GET") options.body = bodyStr;

      const res = await fetch(url, options);
      const data = await res.json();

      if (!res.ok || data.code !== "0") throw new Error(data.msg || `HTTP ${res.status}`);
      return data;
    } catch (err) {
      logError("Bitunix API request failed", err);
      throw err;
    }
  }

  // ====================== Account Info ======================
  async fetchBalance() {
    const endpoint = this.type === "spot"
      ? "/api/spot/v1/user/account"
      : "/api/mix/v1/user/account";
    return this.request(endpoint, "GET");
  }

  // ====================== Pending/Open Orders ======================
  async fetchOpenOrders(symbol = null) {
    let endpoint;
    const body = symbol ? { symbol } : {};
    
    if (this.type === "spot") endpoint = "/api/spot/v1/order/pending/list";
    else if (this.type === "mix" || this.type === "futures") endpoint = "/api/mix/v1/order/pending/list";

    const data = await this.request(endpoint, "POST", {}, body);
    return data.data?.list?.length ? data.data.list : 0;
  }

  // ====================== Place Order ======================
  async placeOrder({ symbol, side, type = "LIMIT", price = null, amount, reduceOnly = false }) {
    let endpoint;
    if (this.type === "spot") endpoint = "/api/spot/v1/order/place_order";
    else if (this.type === "mix" || this.type === "futures") endpoint = "/api/mix/v1/order/place_order";

    const body = { symbol, side, type, amount, reduceOnly };
    if (price) body.price = price;

    return this.request(endpoint, "POST", {}, body);
  }

  // ====================== Cancel Order ======================
  async cancelOrder(orderId, symbol = null) {
    let endpoint;
    if (this.type === "spot") endpoint = "/api/spot/v1/order/cancel";
    else if (this.type === "mix" || this.type === "futures") endpoint = "/api/mix/v1/order/cancel";

    const body = { orderId };
    if (symbol) body.symbol = symbol;

    return this.request(endpoint, "POST", {}, body);
  }

  // ====================== Verify API ======================
  async verifyAPI() {
    try {
      const balance = await this.fetchBalance();
      return { valid: true, info: balance };
    } catch (err) {
      return { valid: false, error: err.message };
    }
  }
}
