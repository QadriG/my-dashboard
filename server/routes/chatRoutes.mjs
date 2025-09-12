// routes/chatRoutes.mjs
import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.mjs";
import { errorHandler } from "../middleware/errorHandler.mjs";
import {
  sendMessage,
  getConversation,
  getUnreadMessages,
  markAsRead,
} from "../controllers/chatController.mjs";

const router = express.Router();

/**
 * ======================
 * Chat Routes (Prisma-based)
 * ======================
 */

// Send a message in a session
router.post("/", authMiddleware, sendMessage);

// Get conversation (all messages in a session)
router.get("/session/:sessionId", authMiddleware, getConversation);

// Get unread messages for logged-in user
router.get("/unread", authMiddleware, getUnreadMessages);

// Mark a message as read
router.patch("/:id/read", authMiddleware, markAsRead);

/**
 * ======================
 * Centralized Error Handler
 * ======================
 */
router.use(errorHandler);

export default router;
