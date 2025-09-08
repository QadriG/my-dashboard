import { PrismaClient } from "@prisma/client";
import { info, warn, error } from "../utils/logger.mjs";

const prisma = new PrismaClient();

// List all users
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
        apis: { select: { exchangeName: true } },
      },
      orderBy: { id: "asc" },
    });
    res.json({ success: true, users });
  } catch (err) {
    error("listAllUsers error:", err);
    next(err);
  }
};

// Pause a user
export const pauseUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.update({
      where: { id: Number(id) },
      data: { status: "paused" },
    });
    res.json({ success: true, message: "User paused", user });
  } catch (err) {
    error("pauseUser error:", err);
    next(err);
  }
};

// Disable a user
export const disableUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.update({
      where: { id: Number(id) },
      data: { status: "disabled" },
    });
    res.json({ success: true, message: "User disabled", user });
  } catch (err) {
    error("disableUser error:", err);
    next(err);
  }
};

// Delete a user
export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id: Number(id) } });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    await prisma.user.delete({ where: { id: Number(id) } });
    res.json({ success: true, message: "User deleted" });
  } catch (err) {
    error("deleteUser error:", err);
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
        role: true,
        status: true,
        free: true,
        used: true,
        total: true,
        lastActivity: true,
        createdAt: true,
        apis: { select: { exchangeName: true } },
      },
    });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
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
    res.json({ success: true, positions });
  } catch (err) {
    error("getUserPositions error:", err);
    next(err);
  }
};

// Update user role
export const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!role) return res.status(400).json({ success: false, message: "Role required" });
    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: { role },
    });
    res.json({ success: true, message: "User role updated", user: updatedUser });
  } catch (err) {
    error("updateUserRole error:", err);
    next(err);
  }
};
