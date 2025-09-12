// server/services/chatService.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Create a new message
export async function createMessage(sessionId, senderId, content, fileUrl = null, fileName = null, fileType = null) {
  return prisma.chatMessage.create({
    data: {
      sessionId,
      senderId,
      content,
      fileUrl,
      fileName,
      fileType
    },
    include: {
      sender: true
    }
  });
}

// Fetch messages by session
export async function getMessagesBySession(sessionId) {
  return prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
    include: { sender: true }
  });
}
