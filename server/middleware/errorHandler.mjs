// errorHandler.mjs
import { error as logError } from "../utils/logger.mjs";

/**
 * Centralized error handler middleware
 */
export const errorHandler = (err, req, res, next) => {
  // Always log full error object (message + stack)
  logError("🔥 Server error:", err);

  const statusCode = err.status || 500;
  const message = err.message || "Internal server error";

  res.status(statusCode).json({
    success: false,
    message,
    // expose stack only in dev for debugging
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};
