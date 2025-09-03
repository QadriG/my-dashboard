// placeOrderOnExchange.mjs

import { getExchangeClient } from "./exchangeClients.mjs";
import { error as logError, info } from "../utils/logger.mjs";

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
  const client = getExchangeClient(exchange, apiKey, apiSecret, type);

  try {
    let response;

    switch (exchange.toLowerCase()) {
      case "binance":
        response =
          type === "futures"
            ? await client.futuresOrder(side.toUpperCase(), symbol, quantity)
            : orderType === "MARKET"
              ? await client.marketBuy(symbol, quantity)
              : await client.order({
                  symbol,
                  side: side.toUpperCase(),
                  type: "LIMIT",
                  quantity,
                  price,
                });
        break;

      case "bybit":
        response =
          type === "futures"
            ? await client.submitOrder({
                side,
                symbol,
                orderType,
                qty: quantity,
                price,
              })
            : await client.submitOrder({
                side,
                symbol,
                orderType,
                qty: quantity,
                price,
              });
        break;

      case "okx":
        response = await client.placeOrder({
          instId: symbol,
          tdMode: type === "futures" ? "cross" : "cash",
          side,
          ordType: orderType.toLowerCase(),
          sz: quantity.toString(),
          px: orderType === "LIMIT" ? price.toString() : undefined,
        });
        break;

      case "coinbase":
        response = await client.rest.order.placeOrder({
          product_id: symbol,
          side,
          type: orderType.toLowerCase(),
          size: quantity,
          price: orderType === "LIMIT" ? price : undefined,
        });
        break;

      case "kucoin":
        response = await client.rest.Trade.Orders.postOrder({
          symbol,
          side,
          type: orderType.toLowerCase(),
          size: quantity,
          price: orderType === "LIMIT" ? price : undefined,
        });
        break;

      case "bitunix":
        response = await client.post("/order/place_order", {
          symbol,
          side: side === "buy" ? 2 : 1,
          type: orderType === "LIMIT" ? 1 : 2,
          volume: quantity.toString(),
          price: orderType === "LIMIT" ? price.toString() : undefined,
        });
        break;

      default:
        throw new Error(`Exchange not supported for order: ${exchange}`);
    }

    info(
      `✅ Order placed on ${exchange} for user ${userEmail} (${userId}): ${side} ${quantity} ${symbol}`
    );
    return response;
  } catch (err) {
    logError(
      `❌ Order failed on ${exchange} for user ${userEmail} (${userId}): ${err.message}`
    );

    // Optionally capture structured error details for logs page
    return {
      success: false,
      error: err.message,
      exchange,
      userId,
      userEmail,
    };
  }
};
