// server/services/tradeExecuters.mjs
import { PrismaClient } from "@prisma/client";
import { getExchangeClient } from "./exchangeClients.mjs";
import { info, error as logError } from "../utils/logger.mjs";

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
      const msg = `User ${userId} does not have ${exchange} connected`;
      logError(msg);
      throw new Error(msg);
    }

    // Get exchange client
    const client = getExchangeClient(exchange, userExchange.apiKey, userExchange.apiSecret);
    info(`Exchange client obtained for user ${userId} on ${exchange}`);

    let orderResult;

    switch (exchange.toLowerCase()) {
      case "binance":
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
          if (action.toLowerCase() === "buy") {
            orderResult = await client.marketBuy(symbol, amount);
          } else {
            orderResult = await client.marketSell(symbol, amount);
          }
        }
        break;

      case "bybit":
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
        const msg = `Unsupported exchange: ${exchange}`;
        logError(msg);
        throw new Error(msg);
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

    info(`Trade executed for user ${userId} on ${exchange}: ${JSON.stringify(trade)}`);
    return trade;
  } catch (err) {
    logError(`Failed to execute trade for user ${userId} on ${exchange}`, err);
    throw err;
  }
};
