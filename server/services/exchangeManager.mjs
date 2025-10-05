import ccxt from "ccxt";
import { BitunixClient } from "./bitunixClient.mjs";

export class ExchangeManager {
  constructor({ exchange, apiKey, apiSecret, passphrase = null, type = "spot" }) {
    this.exchange = exchange.toLowerCase();

    if (this.exchange === "bitunix") {
      this.client = new BitunixClient({ apiKey, apiSecret, type });
    } else if (this.exchange in ccxt) {
      const options = {};
      if (type === "futures") options.defaultType = "future";

      this.client = new ccxt[this.exchange]({
        apiKey,
        secret: apiSecret,
        password: passphrase || undefined,
        options,
      });
    } else {
      throw new Error(`❌ Unsupported exchange: ${exchange}`);
    }
  }

  // Fetch account balance
  async fetchBalance() {
    return await this.client.fetchBalance();
  }

  // Fetch open orders (spot & futures)
  async fetchOpenOrders(symbol = null) {
    if (this.exchange === "bitunix") {
      return await this.client.fetchOpenOrders(symbol);
    } else {
      try {
        const orders = await this.client.fetchOpenOrders(symbol);
        return orders.length ? orders : 0;
      } catch {
        return 0;
      }
    }
  }

  // Place order
  async placeOrder({ symbol, side, amount, price = null, type = "market", reduceOnly = false }) {
    if (this.exchange === "bitunix") {
      return await this.client.placeOrder({ symbol, side, amount, price, type, reduceOnly });
    } else {
      return await this.client.createOrder(symbol, type, side, amount, price);
    }
  }

  // Cancel/close order
  async closeOrder(orderId, symbol = null) {
    if (this.exchange === "bitunix") {
      return await this.client.cancelOrder(orderId, symbol);
    } else {
      return await this.client.cancelOrder(orderId, symbol);
    }
  }

  // Fetch positions if supported
  async fetchPositions() {
    if (this.client.has?.fetchPositions) {
      return await this.client.fetchPositions();
    }
    return [];
  }
}
