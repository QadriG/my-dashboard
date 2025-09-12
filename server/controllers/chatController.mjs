// controllers/chatController.mjs
import { PrismaClient } from "@prisma/client";
import { info, error as logError } from "../utils/logger.mjs";

const prisma = new PrismaClient();

/**
 * Send a chat message
 */
export const sendMessage = async (req, res, next) => {
  try {
    const { sessionId, message } = req.body;

    if (!sessionId || !message) {
      return res.status(400).json({ error: "sessionId and message are required" });
    }

    const chatMessage = await prisma.chatMessage.create({
      data: {
        sessionId: Number(sessionId),
        senderId: req.user.id,
        content: message,
      },
      include: {
        sender: { select: { id: true, name: true, email: true } },
      },
    });

    info(`User ${req.user.id} sent message in session ${sessionId}`);
    res.status(201).json(chatMessage);
  } catch (err) {
    logError("Error sending message", err);
    next(err);
  }
};

/**
 * Get conversation (messages in a session)
 */
export const getConversation = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const messages = await prisma.chatMessage.findMany({
      where: { sessionId: Number(sessionId) },
      orderBy: { createdAt: "asc" },
      include: {
        sender: { select: { id: true, name: true, email: true } },
      },
    });

    res.json(messages);
  } catch (err) {
    logError("Error fetching conversation", err);
    next(err);
  }
};

/**
 * Get unread messages for logged-in user
 */
export const getUnreadMessages = async (req, res, next) => {
  try {
    const unread = await prisma.chatMessage.findMany({
      where: {
        session: {
          OR: [
            { userId: req.user.id },    // user in the session
            { agentId: req.user.id },   // or agent in the session
          ],
        },
        delivered: false,
      },
      include: {
        sender: { select: { id: true, name: true, email: true } },
        session: { select: { id: true } },
      },
    });

    res.json(unread);
  } catch (err) {
    logError("Error fetching unread messages", err);
    next(err);
  }
};

/**
 * Mark a message as read
 */
export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const updated = await prisma.chatMessage.updateMany({
      where: {
        id: Number(id),
        session: {
          OR: [
            { userId: req.user.id },
            { agentId: req.user.id },
          ],
        },
      },
      data: { readAt: new Date(), delivered: true },
    });

    if (updated.count === 0) {
      return res.status(404).json({ error: "Message not found or not authorized" });
    }

    res.json({ success: true });
  } catch (err) {
    logError("Error marking message as read", err);
    next(err);
  }
};
