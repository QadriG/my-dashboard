// adminController.mjs
import { PrismaClient } from "@prisma/client";
import { info, warn, error } from "../utils/logger.mjs"; // centralized logging

const prisma = new PrismaClient();

/**
 * List all users (Admin only)
 */
export const listAllUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true, createdAt: true },
    });
    info(`Listed all users, total: ${users.length}`);
    return res.json({ success: true, users });
  } catch (err) {
    error("listAllUsers error:", err);
    next(err);
  }
};

// Pause a user
export const pauseUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: { status: "paused" },
    });

    info(`User ${id} paused`);
    res.json({ success: true, message: "User paused", user: updatedUser });
  } catch (err) {
    error("pauseUser error:", err);
    next(err);
  }
};

// Disable a user
export const disableUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: { status: "disabled" },
    });

    info(`User ${id} disabled`);
    res.json({ success: true, message: "User disabled", user: updatedUser });
  } catch (err) {
    error("disableUser error:", err);
    next(err);
  }
};

// Get user stats
export const getUserStats = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
      select: {
        id: true,
        email: true,
        name: true,
        api: true,
        free: true,
        used: true,
        total: true,
        createdAt: true,
        lastActivity: true,
        isVerified: true,
        status: true,
      },
    });

    if (!user) {
      warn(`User ${id} not found`);
      return res.status(404).json({ message: "User not found" });
    }

    info(`Fetched stats for user ${id}`);
    res.json({ success: true, stats: user });
  } catch (err) {
    error("getUserStats error:", err);
    next(err);
  }
};

// Get user positions
export const getUserPositions = async (req, res, next) => {
  try {
    const { id } = req.params;

    const positions = await prisma.position.findMany({
      where: { userId: Number(id) },
    });

    info(`Fetched positions for user ${id}, total: ${positions.length}`);
    res.json({ success: true, positions });
  } catch (err) {
    error("getUserPositions error:", err);
    next(err);
  }
};

/**
 * Delete a user (Admin only)
 */
export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id: Number(id) } });
    if (!user) {
      warn(`Attempted to delete non-existent user ${id}`);
      return res.status(404).json({ success: false, message: "User not found" });
    }

    await prisma.user.delete({ where: { id: Number(id) } });
    info(`User ${id} deleted`);
    return res.json({ success: true, message: "User deleted" });
  } catch (err) {
    error("deleteUser error:", err);
    next(err);
  }
};

/**
 * Update a user role (Admin only)
 */
export const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role) {
      warn(`Role not provided for user ${id}`);
      return res.status(400).json({ success: false, message: "Role is required" });
    }

    const user = await prisma.user.findUnique({ where: { id: Number(id) } });
    if (!user) {
      warn(`Attempted to update role of non-existent user ${id}`);
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: { role },
    });

    info(`User ${id} role updated to ${role}`);
    return res.json({ success: true, message: "User role updated", user: updatedUser });
  } catch (err) {
    error("updateUserRole error:", err);
    next(err);
  }
};
