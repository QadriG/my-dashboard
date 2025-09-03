// userRoutes.mjs
import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.mjs";
import { errorHandler } from "../middleware/errorHandler.mjs";
import {
  listUserExchanges,
  addUserExchange,
  removeUserExchange,
} from "../controllers/userController.mjs";
import { info, error as logError } from "../utils/logger.mjs";

const router = express.Router();

/**
 * ======================
 * User Exchange Routes
 * ======================
 */

// List all user exchanges
router.get("/exchanges", authMiddleware, async (req, res, next) => {
  try {
    await listUserExchanges(req, res, next);
    info(`User ${req.user.id} fetched their exchanges`);
  } catch (err) {
    logError(`Error listing exchanges for user ${req.user?.id}`, err);
    next(err);
  }
});

// Add a new exchange for the user
router.post("/exchanges", authMiddleware, async (req, res, next) => {
  try {
    await addUserExchange(req, res, next);
    info(`User ${req.user.id} added a new exchange: ${req.body.exchange}`);
  } catch (err) {
    logError(`Error adding exchange for user ${req.user?.id}`, err);
    next(err);
  }
});

// Remove a user exchange
router.delete("/exchanges/:id", authMiddleware, async (req, res, next) => {
  try {
    await removeUserExchange(req, res, next);
    info(`User ${req.user.id} removed exchange ID: ${req.params.id}`);
  } catch (err) {
    logError(`Error removing exchange ID ${req.params.id} for user ${req.user?.id}`, err);
    next(err);
  }
});

/**
 * ======================
 * Centralized Error Handler
 * ======================
 */
router.use(errorHandler);

export default router;
