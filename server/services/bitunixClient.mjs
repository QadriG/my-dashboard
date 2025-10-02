import crypto from "crypto";
import fetch from "node-fetch";
import { info, error as logError } from "../utils/logger.mjs";
import { decrypt } from "../utils/apiencrypt.mjs";
import { decrypt as decryptLegacy } from "../utils/apiencrypt.mjs";

export class BitunixClient {
  constructor({ apiKey, apiSecret, type = "spot" }) {
  try {
    if (!apiKey || !apiSecret) throw new Error("API key or secret missing");
    info(`Received API key: ${apiKey}, API secret: ${apiSecret}`); // Debug log

    try {
      this.apiKey = decrypt(apiKey);
      this.apiSecret = decrypt(apiSecret);
    } catch {
      // fallback legacy decrypt
      this.apiKey = decryptLegacy(apiKey);
      this.apiSecret = decryptLegacy(apiSecret);
      info("Used legacy decrypt for BitunixClient");
    }

    if (!this.apiKey || !this.apiSecret) {
      throw new Error("Failed to decrypt API credentials");
    }

    this.type = type.toLowerCase();
    this.baseUrl = "https://openapi.bitunix.com";
  } catch (err) {
    logError("BitunixClient decryption failed", err);
    throw err;
  }
}

  sign(params) {
    const query = new URLSearchParams(params).toString();
    const signature = crypto
      .createHmac("sha256", this.apiSecret)
      .update(query)
      .digest("hex");
    return { query, signature };
  }

  async request(endpoint, method = "GET", params = {}, body = null) {
    try {
      const timestamp = Date.now().toString();
      const recvWindow = "5000";

      const allParams = { ...params, apiKey: this.apiKey, timestamp, recvWindow };
      const { query, signature } = this.sign(allParams);
      const url = `${this.baseUrl}${endpoint}?${query}&sign=${signature}`;

      const options = { method, headers: { "Content-Type": "application/json" } };
      if (body) options.body = JSON.stringify(body);

      const res = await fetch(url, options);
      const data = await res.json();

      if (!res.ok || data.code !== "0") throw new Error(data.msg || `HTTP ${res.status}`);
      return data;
    } catch (err) {
      logError("Bitunix API request failed", err);
      throw err;
    }
  }

  async fetchBalance() {
    const endpoint = this.type === "spot" ? "/api/spot/v1/account" : "/api/mix/v1/account";
    return this.request(endpoint, "GET");
  }

  async fetchOpenOrders(symbol = null) {
    const endpoint = this.type === "spot" ? "/api/spot/v1/open-orders" : "/api/mix/v1/open-orders";
    const params = {};
    if (symbol) params.symbol = symbol;
    return this.request(endpoint, "GET", params);
  }
}
