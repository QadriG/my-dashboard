// server/services/exchangeManager.mjs
import ccxt from "ccxt";
import { BitunixClient } from "./bitunixClient.mjs";
// (later we can add BlofinClient if not in ccxt)

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

  async fetchBalance() {
    if (this.exchange === "bitunix") {
      return await this.client.fetchBalance();
    } else {
      return await this.client.fetchBalance();
    }
  }

  async placeOrder({ symbol, side, amount, price, type = "market" }) {
    if (this.exchange === "bitunix") {
      return await this.client.placeOrder(symbol, side, amount, price);
    } else {
      return await this.client.createOrder(symbol, type, side, amount, price);
    }
  }

  async closeOrder(orderId, symbol) {
    if (this.exchange === "bitunix") {
      return await this.client.closeOrder(orderId);
    } else {
      return await this.client.cancelOrder(orderId, symbol);
    }
  }
}
