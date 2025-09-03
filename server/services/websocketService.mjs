// server/services/websocketService.mjs
import WebSocket from "ws";
import { info, error as logError } from "../utils/logger.mjs";

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
    info("New WebSocket connection established");

    ws.isAlive = true;

    // Expect client to send auth token immediately to register userId
    ws.on("message", (message) => {
      try {
        const msg = JSON.parse(message.toString());
        if (msg.type === "auth" && msg.userId) {
          ws.userId = msg.userId;
          if (!userConnections.has(msg.userId)) userConnections.set(msg.userId, []);
          userConnections.get(msg.userId).push(ws);
          info(`Registered WebSocket for userId: ${msg.userId}`);
        }
      } catch (err) {
        logError("WebSocket message parse error:", err);
      }
    });

    ws.on("pong", () => (ws.isAlive = true));

    ws.on("close", () => {
      if (ws.userId && userConnections.has(ws.userId)) {
        const arr = userConnections.get(ws.userId).filter((c) => c !== ws);
        if (arr.length > 0) userConnections.set(ws.userId, arr);
        else userConnections.delete(ws.userId);
      }
      info("WebSocket connection closed");
    });

    ws.on("error", (err) => logError("WebSocket error:", err));
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

  info("WebSocket server initialized");
  wss.on("close", () => clearInterval(interval));
};

/**
 * Broadcast alert to specific users
 * @param {*} alert - alert object from webhook
 * @param {*} userIds - array of userIds to send the alert to
 */
export const broadcastToUsers = (alert, userIds) => {
  if (!wss) return logError("WebSocket server not initialized");

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

  info(`Broadcasted alert to users [${userIds.join(", ")}]:`, {
    exchange: alert.exchange,
    symbol: alert.symbol,
    action: alert.action,
  });
};
