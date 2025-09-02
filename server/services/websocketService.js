import WebSocket from "ws";

let wss;
// Map of userId to WebSocket connections
const userConnections = new Map();

/**
 * Initialize WebSocket server
 * @param {*} server - HTTP server instance
 */
export const initWebSocket = (server) => {
  wss = new WebSocket.Server({ server });

  wss.on("connection", (ws, req) => {
    console.log("New WebSocket connection established");

    ws.isAlive = true;

    // Expect client to send auth token immediately to register userId
    ws.on("message", (message) => {
      try {
        const msg = JSON.parse(message.toString());
        if (msg.type === "auth" && msg.userId) {
          ws.userId = msg.userId;
          if (!userConnections.has(msg.userId)) userConnections.set(msg.userId, []);
          userConnections.get(msg.userId).push(ws);
          console.log(`Registered WebSocket for userId: ${msg.userId}`);
        }
      } catch (err) {
        console.error("WebSocket message parse error:", err);
      }
    });

    ws.on("pong", () => (ws.isAlive = true));

    ws.on("close", () => {
      if (ws.userId && userConnections.has(ws.userId)) {
        const arr = userConnections.get(ws.userId).filter((c) => c !== ws);
        if (arr.length > 0) userConnections.set(ws.userId, arr);
        else userConnections.delete(ws.userId);
      }
      console.log("WebSocket connection closed");
    });

    ws.on("error", (err) => console.error("WebSocket error:", err));
  });

  // Heartbeat
  const interval = setInterval(() => {
    if (!wss) return;
    wss.clients.forEach((ws) => {
      if (!ws.isAlive) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  console.log("WebSocket server initialized");
  wss.on("close", () => clearInterval(interval));
};

/**
 * Broadcast alert to specific users
 * @param {*} alert - alert object from webhook
 * @param {*} userIds - array of userIds to send the alert to
 */
export const broadcastToUsers = (alert, userIds) => {
  if (!wss) return console.error("WebSocket server not initialized");

  const payload = JSON.stringify({
    type: "alert",
    data: {
      id: alert.id,
      exchange: alert.exchange,
      symbol: alert.symbol,
      action: alert.action,
      price: alert.price,
      tp: alert.tp,
      sl: alert.sl,
      status: alert.status,
      rawPayload: alert.rawPayload,
    },
  });

  userIds.forEach((uid) => {
    if (userConnections.has(uid)) {
      userConnections.get(uid).forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) ws.send(payload);
      });
    }
  });

  console.log(`Broadcasted alert to users [${userIds.join(", ")}]:`, {
    exchange: alert.exchange,
    symbol: alert.symbol,
    action: alert.action,
  });
};
