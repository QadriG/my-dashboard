// middleware/auth.mjs

// Admin-only access
export const isAdmin = (req, res, next) => {
  try {
    // req.user should be populated from JWT
    if (!req.user || req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Access denied: Admins only" });
    }

    // Block paused or disabled admins (optional)
    if (req.user.status === "paused" || req.user.status === "disabled") {
      return res.status(403).json({ error: `Access denied: Your account is ${req.user.status}` });
    }

    next();
  } catch (err) {
    console.error("❌ Auth middleware error:", err);
    res.status(401).json({ error: "Unauthorized" });
  }
};

// General access for all logged-in users
export const isAuthenticated = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Block paused or disabled users
    if (req.user.status === "paused" || req.user.status === "disabled") {
      return res.status(403).json({ error: `Access denied: Your account is ${req.user.status}` });
    }

    next();
  } catch (err) {
    console.error("❌ Auth middleware error:", err);
    res.status(401).json({ error: "Unauthorized" });
  }
};
