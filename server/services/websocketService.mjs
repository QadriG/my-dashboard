// server/services/websocketService.mjs
import WebSocket, { WebSocketServer } from "ws";
import { PrismaClient } from "@prisma/client";
import { info, error as logError } from "../utils/logger.mjs";

const prisma = new PrismaClient();

let wss;

// Map of userId -> array of active WebSocket connections
const userConnections = new Map();

// Map of roomId -> Set of userIds (for chat rooms)
const roomSubscriptions = new Map();

/**
 * Initialize WebSocket server
 */
export const initWebSocket = (server) => {
  wss = new WebSocketServer({ server });

  wss.on("connection", (ws) => {
    info("New WebSocket connection established");
    ws.isAlive = true;

    ws.on("message", async (rawMessage) => {
      try {
        const msg = JSON.parse(rawMessage.toString());

        // ✅ Handle authentication
        if (msg.type === "auth" && msg.userId) {
          ws.userId = msg.userId;
          if (!userConnections.has(ws.userId)) userConnections.set(ws.userId, []);
          userConnections.get(ws.userId).push(ws);
          info(`Registered WebSocket for userId: ${ws.userId}`);

          // 🔥 Send unread messages on connect
          const unread = await prisma.chatMessage.findMany({
            where: { recipientId: ws.userId, read: false },
            orderBy: { createdAt: "asc" },
          });

          if (unread.length > 0) {
            for (const m of unread) {
              sendToUser(ws.userId, {
                type: "chat",
                id: m.id,
                senderId: m.senderId,
                recipientId: m.recipientId,
                text: m.message,
                timestamp: m.createdAt,
              });
            }

            // Mark all as read
            await prisma.chatMessage.updateMany({
              where: { recipientId: ws.userId, read: false },
              data: { read: true },
            });

            info(`Delivered ${unread.length} unread messages to user ${ws.userId}`);
          }
          return;
        }

        // ✅ Handle room join
        if (msg.type === "joinRoom" && msg.roomId && ws.userId) {
          joinRoom(ws.userId, msg.roomId);
          info(`User ${ws.userId} joined room ${msg.roomId}`);
          return;
        }

        // ✅ Handle chat message
        if (msg.type === "chat" && msg.recipientId && msg.text && ws.userId) {
          // 1. Save to DB
          const chatMessage = await prisma.chatMessage.create({
            data: {
              senderId: ws.userId,
              recipientId: msg.recipientId,
              message: msg.text,
              read: false,
            },
          });

          const payload = {
            type: "chat",
            id: chatMessage.id,
            senderId: ws.userId,
            recipientId: msg.recipientId,
            text: msg.text,
            timestamp: chatMessage.createdAt,
          };

          // 2. Send to recipient (if online)
          if (sendToUser(msg.recipientId, payload)) {
            // mark as read instantly if delivered live
            await prisma.chatMessage.update({
              where: { id: chatMessage.id },
              data: { read: true },
            });
          }

          // 3. Echo back to sender
          sendToUser(ws.userId, payload);

          info(`Chat message stored & delivered from ${ws.userId} -> ${msg.recipientId}`);
          return;
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
 * Clean up on disconnect
 */
function cleanupConnection(ws) {
  if (ws.userId && userConnections.has(ws.userId)) {
    const arr = userConnections.get(ws.userId).filter((c) => c !== ws);
    if (arr.length > 0) {
      userConnections.set(ws.userId, arr);
    } else {
      userConnections.delete(ws.userId);
    }

    // Remove user from rooms
    for (const [roomId, members] of roomSubscriptions.entries()) {
      if (members.has(ws.userId)) {
        members.delete(ws.userId);
        if (members.size === 0) roomSubscriptions.delete(roomId);
      }
    }
  }
}

/**
 * Subscribe user to a chat room
 */
function joinRoom(userId, roomId) {
  if (!roomSubscriptions.has(roomId)) {
    roomSubscriptions.set(roomId, new Set());
  }
  roomSubscriptions.get(roomId).add(userId);
}

/**
 * Broadcast alert to specific users (trade alerts, system alerts, etc.)
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

  info(`Broadcasted alert to users [${userIds.join(", ")}]`, {
    exchange: alert.exchange,
    symbol: alert.symbol,
    action: alert.action,
  });
};

/**
 * Send a chat message object to a single user
 */
export const sendToUser = (userId, message) => {
  if (!userConnections.has(userId)) return false;

  const payload = JSON.stringify(message);
  userConnections.get(userId).forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(payload);
  });
  return true;
};
