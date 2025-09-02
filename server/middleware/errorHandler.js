/**
 * Centralized error handler middleware
 */
export const errorHandler = (err, req, res, next) => {
  console.error("Server error:", err);

  const statusCode = err.status || 500;
  const message = err.message || "Internal server error";

  res.status(statusCode).json({ error: message });
};
