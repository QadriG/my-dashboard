// adminController.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * List all users (Admin only)
 */
export const listAllUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true, createdAt: true },
    });
    return res.json({ success: true, users });
  } catch (err) {
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

    res.json({ success: true, message: "User paused", user: updatedUser });
  } catch (err) {
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

    res.json({ success: true, message: "User disabled", user: updatedUser });
  } catch (err) {
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

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ success: true, stats: user });
  } catch (err) {
    next(err);
  }
};

// Get user positions
export const getUserPositions = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Example - depends on how positions are stored in DB
    const positions = await prisma.position.findMany({
      where: { userId: Number(id) },
    });

    res.json({ success: true, positions });
  } catch (err) {
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
      return res.status(404).json({ success: false, message: "User not found" });
    }

    await prisma.user.delete({ where: { id: Number(id) } });
    return res.json({ success: true, message: "User deleted" });
  } catch (err) {
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
      return res.status(400).json({ success: false, message: "Role is required" });
    }

    const user = await prisma.user.findUnique({ where: { id: Number(id) } });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: { role },
    });

    return res.json({ success: true, message: "User role updated", user: updatedUser });
  } catch (err) {
    next(err);
  }
  
};
