import { PrismaClient } from "@prisma/client";
import { info, warn, error } from "../utils/logger.mjs";

const prisma = new PrismaClient();

// ======================
// List all users
// ======================
export const listAllUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        free: true,
        used: true,
        total: true,
        createdAt: true,
        updatedAt: true,
        lastActivity: true,
        exchanges: {
          select: {
            provider: true, // Changed from exchangeName
            type: true,
            isActive: true,
          },
        },
      },
      orderBy: { id: "asc" },
    });
    res.json({ success: true, users });
  } catch (err) {
    error("listAllUsers error:", err);
    next(err);
  }
};

// ======================
// Helper: Pause/cancel trades and positions
// ======================
const pauseUserTradesAndPositions = async (userId) => {
  try {
    await prisma.trade.updateMany({
      where: { userId, status: "active" },
      data: { status: "paused" },
    });
    await prisma.position.updateMany({
      where: { userId, status: "open" },
      data: { status: "paused" },
    });
    info(`Paused all active trades and positions for user ${userId}`);
  } catch (err) {
    error(`Error pausing trades/positions for user ${userId}:`, err);
  }
};

// ======================
// Pause user
// ======================
export const pauseUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (isNaN(Number(id))) return res.status(400).json({ success: false, message: "Invalid user ID" });

    const user = await prisma.user.update({
      where: { id: Number(id) },
      data: {
        status: "disabled", // or "paused" for pauseUser function
        tokenVersion: { increment: 1 },
      },
    });

    await pauseUserTradesAndPositions(Number(id));

    info(`User ${id} paused by admin ${req.user?.id}`);
    res.json({ success: true, message: "User paused", user });
  } catch (err) {
    error("pauseUser error:", err);
    next(err);
  }
};

// ======================
// Unpause user
// ======================
export const unpauseUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (isNaN(Number(id))) return res.status(400).json({ success: false, message: "Invalid user ID" });

    const user = await prisma.user.update({
      where: { id: Number(id) },
      data: { status: "active" },
    });

    info(`User ${id} unpaused by admin ${req.user?.id}`);
    res.json({ success: true, message: "User unpaused", user });
  } catch (err) {
    error("unpauseUser error:", err);
    next(err);
  }
};

// ======================
// Disable user
// ======================
export const disableUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (isNaN(Number(id))) return res.status(400).json({ success: false, message: "Invalid user ID" });

    const user = await prisma.user.update({
      where: { id: Number(id) },
      data: { status: "disabled" },
    });

    await pauseUserTradesAndPositions(Number(id));

    info(`User ${id} disabled by admin ${req.user?.id}`);
    res.json({ success: true, message: "User disabled", user });
  } catch (err) {
    error("disableUser error:", err);
    next(err);
  }
};

// ======================
// Enable user
// ======================
export const enableUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (isNaN(Number(id))) return res.status(400).json({ success: false, message: "Invalid user ID" });

    const user = await prisma.user.update({
      where: { id: Number(id) },
      data: { status: "active" },
    });

    info(`User ${id} enabled by admin ${req.user?.id}`);
    res.json({ success: true, message: "User enabled", user });
  } catch (err) {
    error("enableUser error:", err);
    next(err);
  }
};

// ======================
// Delete user
// ======================
export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (isNaN(Number(id))) return res.status(400).json({ success: false, message: "Invalid user ID" });

    const user = await prisma.user.findUnique({ where: { id: Number(id) } });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    await prisma.user.delete({ where: { id: Number(id) } });
    info(`User ${id} deleted by admin ${req.user?.id}`);
    res.json({ success: true, message: "User deleted" });
  } catch (err) {
    error("deleteUser error:", err);
    next(err);
  }
};

// ======================
// Get user stats
// ======================
export const getUserStats = async (req, res, next) => {
  try {
    const userId = Number(req.params.id);
    if (isNaN(userId)) return res.status(400).json({ success: false, message: "Invalid user ID" });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        free: true,
        used: true,
        total: true,
        lastActivity: true,
        createdAt: true,
        exchanges: {
          select: {
            provider: true, // Changed from exchangeName
            type: true,
            isActive: true,
          },
        },
        trades: {
          select: {
            id: true,
            symbol: true,
            amount: true,
            price: true,
            tradeTime: true,
            status: true,
          },
        },
        positions: {
          select: {
            id: true,
            symbol: true,
            amount: true,
            entryPrice: true, // Changed from price
            status: true,
          },
        },
      },
    });

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    return res.json({ success: true, stats: user });
  } catch (err) {
    error("getUserStats error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch user stats" });
  }
};

// ======================
// Get user positions
// ======================
export const getUserPositions = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (isNaN(Number(id))) return res.status(400).json({ success: false, message: "Invalid user ID" });

    const positions = await prisma.position.findMany({
      where: { userId: Number(id) },
    });
    res.json({ success: true, positions });
  } catch (err) {
    error("getUserPositions error:", err);
    next(err);
  }
};

// ======================
// Update user role
// ======================
export const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (isNaN(Number(id))) return res.status(400).json({ success: false, message: "Invalid user ID" });
    const { role } = req.body;
    if (!role) return res.status(400).json({ success: false, message: "Role required" });

    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: { role },
    });

    info(`User ${id} role changed to ${role} by admin ${req.user?.id}`);
    res.json({ success: true, message: "User role updated", user: updatedUser });
  } catch (err) {
    error("updateUserRole error:", err);
    next(err);
  }
};