// server/services/websocketService.mjs
import WebSocket, { WebSocketServer } from "ws";
import { info, error as logError, warn } from "../utils/logger.mjs";
// import jwt from "jsonwebtoken"; // optional if you want JWT validation

let wss;
// Map of userId -> array of active WebSocket connections
const userConnections = new Map();

/**
 * Initialize WebSocket server
 * @param {*} server - HTTP server instance
 */
export const initWebSocket = (server) => {
  wss = new WebSocketServer({ server });

  wss.on("connection", (ws, req) => {
    info("New WebSocket connection established");

    ws.isAlive = true;

    ws.on("message", (message) => {
      try {
        const msg = JSON.parse(message.toString());

        if (msg.type === "auth" && msg.token) {
          // Example: validate token -> extract userId
          // let decoded;
          // try {
          //   decoded = jwt.verify(msg.token, process.env.JWT_SECRET);
          // } catch (err) {
          //   ws.close(4001, "Invalid token");
          //   return;
          // }
          // const userId = decoded.userId;

          const userId = msg.userId; // fallback if no JWT validation
          if (!userId) {
            warn("Auth message missing userId");
            return;
          }

          ws.userId = userId;
          if (!userConnections.has(userId)) userConnections.set(userId, []);
          userConnections.get(userId).push(ws);

          info(`Registered WebSocket for userId: ${userId}`);
        }
      } catch (err) {
        logError("WebSocket message parse error:", err);
      }
    });

    ws.on("pong", () => {
      ws.isAlive = true;
    });

    ws.on("close", () => {
      cleanupConnection(ws);
      info(`WebSocket connection closed (userId: ${ws.userId || "unknown"})`);
    });

    ws.on("error", (err) => {
      logError("WebSocket error:", err);
      cleanupConnection(ws);
    });
  });

  // Heartbeat to keep connections alive
  const interval = setInterval(() => {
    if (!wss) return;
    wss.clients.forEach((ws) => {
      if (!ws.isAlive) {
        logError(`Terminating dead WebSocket (userId: ${ws.userId || "unknown"})`);
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on("close", () => clearInterval(interval));
  info("WebSocket server initialized");
};

/**
 * Clean up userConnections map when a socket closes or errors
 */
function cleanupConnection(ws) {
  if (ws.userId && userConnections.has(ws.userId)) {
    const arr = userConnections.get(ws.userId).filter((c) => c !== ws);
    if (arr.length > 0) {
      userConnections.set(ws.userId, arr);
    } else {
      userConnections.delete(ws.userId);
    }
  }
}

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
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(payload);
        }
      });
    }
  });

  info(`Broadcasted alert to users [${userIds.join(", ")}]:`, {
    exchange: alert.exchange,
    symbol: alert.symbol,
    action: alert.action,
  });
};

/**
 * Send a message to a single user
 */
export const sendToUser = (userId, message) => {
  if (!userConnections.has(userId)) return false;

  const payload = JSON.stringify(message);
  userConnections.get(userId).forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(payload);
  });
  return true;
};
