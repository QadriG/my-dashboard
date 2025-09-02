import express from "express";
import {
  listAllUsers,
  deleteUser,
  updateUserRole,
  pauseUser,
  disableUser,
  getUserStats,
  getUserPositions,
} from "../controllers/adminController.js";
import { requireRole } from "../middleware/roleMiddleware.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/users", authMiddleware, requireRole("admin"), listAllUsers);
router.delete("/users/:id", authMiddleware, requireRole("admin"), deleteUser);
router.patch("/users/:id/role", authMiddleware, requireRole("admin"), updateUserRole);

router.patch("/users/:id/pause", authMiddleware, requireRole("admin"), pauseUser);
router.patch("/users/:id/disable", authMiddleware, requireRole("admin"), disableUser);

router.get("/users/:id/stats", authMiddleware, requireRole("admin"), getUserStats);
router.get("/users/:id/positions", authMiddleware, requireRole("admin"), getUserPositions);

export default router;
