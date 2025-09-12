// server/controllers/chatController.mjs
import { PrismaClient } from "@prisma/client";
import { info, warn, error } from "../utils/logger.mjs";
import { sendToUser } from "../services/websocketService.mjs";

const prisma = new PrismaClient();

/**
 * Create a new chat session (user side)
 */
export const createSession = async (req, res, next) => {
  try {
    const session = await prisma.chatSession.create({
      data: {
        userId: req.user.id,
        status: "pending",
      },
    });

    info(`User ${req.user.id} started new chat session ${session.id}`);
    return res.status(201).json({ success: true, session });
  } catch (err) {
    error("createSession error:", err);
    next(err);
  }
};

/**
 * Assign an agent (admin) to a session
 */
export const assignAgent = async (req, res, next) => {
  try {
    const { sessionId } = req.body;

    const session = await prisma.chatSession.update({
      where: { id: Number(sessionId) },
      data: { agentId: req.user.id, status: "active" },
    });

    info(`Agent ${req.user.id} assigned to session ${sessionId}`);
    sendToUser(session.userId, { type: "chat_update", session });

    return res.json({ success: true, session });
  } catch (err) {
    error("assignAgent error:", err);
    next(err);
  }
};

/**
 * Send a chat message
 */
export const sendMessage = async (req, res, next) => {
  try {
    const { sessionId, content } = req.body;

    const session = await prisma.chatSession.findUnique({
      where: { id: Number(sessionId) },
      include: { user: true, agent: true },
    });

    if (!session) {
      warn(`Invalid session ${sessionId}`);
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    const message = await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        senderId: req.user.id,
        content,
      },
    });

    info(`Message sent in session ${sessionId} by user ${req.user.id}`);

    // notify other party live
    const targetId = req.user.id === session.userId ? session.agentId : session.userId;
    if (targetId) {
      sendToUser(targetId, { type: "chat_message", message });
    }

    return res.status(201).json({ success: true, message });
  } catch (err) {
    error("sendMessage error:", err);
    next(err);
  }
};

/**
 * Fetch session messages
 */
export const getMessages = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const messages = await prisma.chatMessage.findMany({
      where: { sessionId: Number(sessionId) },
      orderBy: { createdAt: "asc" },
    });

    return res.json({ success: true, messages });
  } catch (err) {
    error("getMessages error:", err);
    next(err);
  }
};

/**
 * Close a session
 */
export const closeSession = async (req, res, next) => {
  try {
    const { sessionId } = req.body;

    const session = await prisma.chatSession.update({
      where: { id: Number(sessionId) },
      data: { status: "closed" },
    });

    info(`Session ${sessionId} closed by ${req.user.id}`);

    sendToUser(session.userId, { type: "chat_closed", sessionId });
    if (session.agentId) {
      sendToUser(session.agentId, { type: "chat_closed", sessionId });
    }

    return res.json({ success: true, session });
  } catch (err) {
    error("closeSession error:", err);
    next(err);
  }
};
