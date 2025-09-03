// roleMiddleware.mjs
import { error as logError } from "../utils/logger.mjs";

/**
 * Role-based access control middleware
 * @param {string[]} roles - allowed roles, e.g. ["admin"]
 */
export const roleMiddleware = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      logError("Unauthorized access attempt: no user attached to request");
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (!roles.includes(req.user.role)) {
      logError(`Forbidden access attempt by user ${req.user.id} with role ${req.user.role}`);
      return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
    }
    next();
  };
};
