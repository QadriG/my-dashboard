// roleMiddleware.js

/**
 * Role-based access control middleware
 * @param {string[]} roles - allowed roles, e.g. ["admin"]
 */
export const roleMiddleware = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
    }
    next();
  };
};
