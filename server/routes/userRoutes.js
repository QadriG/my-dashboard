// server/routes/userRoutes.js
import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";
import { errorHandler } from "../middleware/errorHandler.js";
import {
  listUserExchanges,
  addUserExchange,
  removeUserExchange,
  listAllUsers,
} from "../controllers/userController.js";

const router = express.Router();

/**
 * ======================
 * User Exchange Routes
 * ======================
 */
router.get("/exchanges", authMiddleware, listUserExchanges);
router.post("/exchanges", authMiddleware, addUserExchange);
router.delete("/exchanges/:id", authMiddleware, removeUserExchange);

/**
 * ======================
 * Admin Routes
 * ======================
 */
router.get(
  "/all-users",
  authMiddleware,
  roleMiddleware(["admin"]),
  listAllUsers
);

/**
 * ======================
 * Centralized Error Handler
 * ======================
 */
router.use(errorHandler);

export default router;
