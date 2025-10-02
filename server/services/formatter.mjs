// server/services/formatter.mjs
export function formatOrderResponse(exchange, rawOrder, action) {
  const now = new Date().toISOString();

  if (action === "open") {
    return {
      ID: rawOrder.id || rawOrder.orderId || `ORD-${Date.now()}`,
      Symbol: rawOrder.symbol || "",
      Side: rawOrder.side || "",
      Amount: rawOrder.amount || rawOrder.origQty || "",
      OrderValue: rawOrder.cost || (rawOrder.price * rawOrder.amount) || "",
      OpenPrice: rawOrder.price || "",
      Status: rawOrder.status || "open",
      OpenDate: rawOrder.timestamp ? new Date(rawOrder.timestamp).toISOString() : now,
    };
  }

  if (action === "close") {
    return {
      ID: rawOrder.id || rawOrder.orderId || `ORD-${Date.now()}`,
      Symbol: rawOrder.symbol || "",
      Side: rawOrder.side || "",
      Amount: rawOrder.amount || "",
      OrderValue: rawOrder.cost || "",
      OpenPrice: rawOrder.average || "",
      ClosePrice: rawOrder.price || "",
      Profit: rawOrder.profit || "",
      PnL: rawOrder.pnl || "",
      Status: rawOrder.status || "closed",
      OpenDate: rawOrder.openTime || now,
      CloseDate: rawOrder.closeTime || now,
    };
  }

  return rawOrder;
}
