// server/services/tradeExecuters.mjs
import { PrismaClient } from "@prisma/client";
import { getExchangeClient } from "./exchangeClients.mjs";
import { info, error as logError } from "../utils/logger.mjs";

const prisma = new PrismaClient();

/**
 * Execute a trade for a user on a specific exchange using CCXT
 * @param {Object} params
 * @param {number} params.userId
 * @param {string} params.exchange - exchange name ("Binance", "Bybit", etc.)
 * @param {string} params.symbol - trading pair, e.g., "BTC/USDT"
 * @param {string} params.action - "buy" or "sell"
 * @param {number} params.amount - amount to buy/sell
 * @param {number} [params.price] - optional price for limit order; if undefined, market order
 */
export const executeTrade = async ({ userId, exchange, symbol, action, amount, price }) => {
  try {
    // ✅ Fetch user to check status
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error(`User ${userId} not found`);

    // ✅ Prevent trades if user is paused or disabled
    if (user.status !== "active") {
      const msg = `User ${userId} is ${user.status}, skipping trade`;
      info(msg);
      return null; // don't execute trade
    }

    // Fetch user's saved exchange credentials
    const userExchange = await prisma.userExchange.findFirst({
      where: { userId, exchange },
    });

    if (!userExchange) {
      const msg = `❌ User ${userId} does not have ${exchange} connected`;
      logError(msg);
      throw new Error(msg);
    }

    // Create CCXT client
    const client = getExchangeClient(exchange, userExchange.apiKey, userExchange.apiSecret, "spot", userExchange.passphrase);
    info(`✅ Exchange client obtained for user ${userId} on ${exchange}`);

    const ccxtSide = action.toLowerCase();
    const ccxtType = price ? "limit" : "market";

    const orderResult = await client.createOrder(
      symbol,
      ccxtType,
      ccxtSide,
      amount,
      price
    );

    const trade = await prisma.trade.create({
      data: {
        userId,
        symbol,
        amount,
        price:
          price ??
          orderResult.average ??
          orderResult.price ??
          (orderResult.fills?.length ? orderResult.fills[0].price : 0),
        exchange,
        side: action,
        orderId: orderResult.id ?? null,
        rawResponse: JSON.stringify(orderResult),
      },
    });

    info(`✅ Trade executed for user ${userId} on ${exchange}: ${JSON.stringify(trade)}`);
    return trade;
  } catch (err) {
    logError(`❌ Failed to execute trade for user ${userId} on ${exchange}`, err);
    throw err;
  }
};
