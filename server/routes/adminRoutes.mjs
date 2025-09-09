import express from "express";
import {
  listAllUsers,
  deleteUser,
  updateUserRole,
  pauseUser,
  disableUser,
  getUserStats,
  getUserPositions,
  unpauseUser,
  enableUser,
} from "../controllers/adminController.mjs";
import { authMiddleware } from "../middleware/authMiddleware.mjs";
import { roleMiddleware } from "../middleware/roleMiddleware.mjs";
import { errorHandler } from "../middleware/errorHandler.mjs";
import { info } from "../utils/logger.mjs";

const router = express.Router();

/**
 * ======================
 * Admin User Management Routes
 * ======================
 */
router.get("/users", authMiddleware, roleMiddleware(["admin"]), (req, res, next) => {
  info(`Admin ${req.user.id} accessed all users`);
  listAllUsers(req, res, next);
});

router.delete("/users/:id", authMiddleware, roleMiddleware(["admin"]), (req, res, next) => {
  info(`Admin ${req.user.id} deleting user ${req.params.id}`);
  deleteUser(req, res, next);
});

router.patch("/users/:id/role", authMiddleware, roleMiddleware(["admin"]), (req, res, next) => {
  info(`Admin ${req.user.id} updating role for user ${req.params.id}`);
  updateUserRole(req, res, next);
});

router.patch("/users/:id/pause", authMiddleware, roleMiddleware(["admin"]), (req, res, next) => {
  info(`Admin ${req.user.id} pausing user ${req.params.id}`);
  pauseUser(req, res, next);
});

router.patch("/users/:id/unpause", authMiddleware, roleMiddleware(["admin"]), (req, res, next) => {
  info(`Admin ${req.user.id} unpausing user ${req.params.id}`);
  unpauseUser(req, res, next);
});

router.patch("/users/:id/disable", authMiddleware, roleMiddleware(["admin"]), (req, res, next) => {
  info(`Admin ${req.user.id} disabling user ${req.params.id}`);
  disableUser(req, res, next);
});

router.patch("/users/:id/enable", authMiddleware, roleMiddleware(["admin"]), (req, res, next) => {
  info(`Admin ${req.user.id} enabling user ${req.params.id}`);
  enableUser(req, res, next);
});

router.get("/users/:id/stats", authMiddleware, roleMiddleware(["admin"]), (req, res, next) => {
  info(`Admin ${req.user.id} fetching stats for user ${req.params.id}`);
  getUserStats(req, res, next);
});

router.get("/users/:id/positions", authMiddleware, roleMiddleware(["admin"]), (req, res, next) => {
  info(`Admin ${req.user.id} fetching positions for user ${req.params.id}`);
  getUserPositions(req, res, next);
});

/**
 * ======================
 * Centralized Error Handler
 * ======================
 */
router.use(errorHandler);

export default router;