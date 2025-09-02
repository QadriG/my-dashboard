// server/services/tradeExecuters.js
import { PrismaClient } from "@prisma/client";
import { getExchangeClient } from "./exchangeClients.js";

const prisma = new PrismaClient();

/**
 * Execute a trade for a user on a specific exchange
 * @param {Object} params
 * @param {number} params.userId
 * @param {string} params.exchange - exchange name ("Binance", "Bybit")
 * @param {string} params.symbol - trading pair, e.g., "BTCUSDT"
 * @param {string} params.action - "buy" or "sell"
 * @param {number} params.amount - amount to buy/sell
 * @param {number} [params.price] - optional price for limit order; if undefined, market order
 */
export const executeTrade = async ({ userId, exchange, symbol, action, amount, price }) => {
  try {
    // Get user's exchange credentials
    const userExchange = await prisma.userExchange.findFirst({
      where: { userId, exchange },
    });

    if (!userExchange) {
      throw new Error(`User ${userId} does not have ${exchange} connected`);
    }

    // Get exchange client
    const client = getExchangeClient(exchange, userExchange.apiKey, userExchange.apiSecret);

    let orderResult;

    switch (exchange.toLowerCase()) {
      case "binance":
        // Binance: market order if price not provided, otherwise limit
        if (price) {
          orderResult = await client.order({
            symbol,
            side: action.toUpperCase(),
            type: "LIMIT",
            quantity: amount,
            price,
            timeInForce: "GTC",
          });
        } else {
          orderResult = await client.marketBuy(symbol, amount); // use marketSell for "sell"
          if (action.toLowerCase() === "sell") {
            orderResult = await client.marketSell(symbol, amount);
          }
        }
        break;

      case "bybit":
        // Bybit Spot: market order if price not provided
        if (price) {
          orderResult = await client.placeActiveOrder({
            symbol,
            side: action.toUpperCase(),
            orderType: "LIMIT",
            qty: amount,
            price,
            timeInForce: "PostOnly",
          });
        } else {
          orderResult = await client.placeActiveOrder({
            symbol,
            side: action.toUpperCase(),
            orderType: "MARKET",
            qty: amount,
          });
        }
        break;

      default:
        throw new Error(`Unsupported exchange: ${exchange}`);
    }

    // Save trade to database
    const trade = await prisma.trade.create({
      data: {
        userId,
        symbol,
        amount,
        price: price ?? orderResult.avgFillPrice ?? orderResult.fills?.[0]?.price ?? 0,
      },
    });

    console.log(`Trade executed for user ${userId} on ${exchange}:`, trade);
    return trade;
  } catch (err) {
    console.error(`Failed to execute trade for user ${userId} on ${exchange}:`, err);
    throw err;
  }
};
