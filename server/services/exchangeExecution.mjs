// server/services/placeOrderOnExchange.mjs
import { getExchangeClient } from "./exchangeClients.mjs";
import { info, warn, error as logError } from "../utils/logger.mjs"; // ✅ Import warn

export const placeOrderOnExchange = async ({
  exchange,
  apiKey,
  apiSecret,
  type = "spot",
  symbol,
  side,
  orderType = "MARKET",
  quantity,
  price,
  userId,
  userEmail
}) => {
  try {
    // ✅ Check user status first
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error(`User ${userId} not found`);

    if (user.status !== "active") {
      info(`User ${userId} is ${user.status}, skipping order`); // ✅ INFO: User not active, skip
      return null; // skip placing the order
    }

    const detectedType = type || "spot";
    const client = getExchangeClient(exchange, apiKey, apiSecret, detectedType);


    let response;

    const ccxtSide = side.toLowerCase(); // "buy" or "sell"
    const ccxtType = orderType.toLowerCase(); // "market" or "limit"
    const amount = quantity;
    const ccxtPrice = ccxtType === "limit" ? price : undefined;

    response = await client.createOrder(symbol, ccxtType, ccxtSide, amount, ccxtPrice);

    info(
      `✅ [${exchange}] Order placed for user ${userEmail} (${userId}): ${side} ${quantity} ${symbol} (${orderType})`
    );
    return response;
  } catch (err) {
    logError(
      `❌ [${exchange}] Order failed for user ${userEmail} (${userId}): ${err.message}`
    ); // ❌ ERROR: Order failed

    return {
      success: false,
      error: err.message,
      exchange,
      userId,
      userEmail,
    };
  }
};