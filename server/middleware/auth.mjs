// middleware/auth.mjs
export const isAdmin = (req, res, next) => {
  try {
    // Assuming you attach user info from JWT in req.user
    if (!req.user || req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Access denied: Admins only" });
    }
    next();
  } catch (err) {
    console.error("❌ Auth middleware error:", err);
    res.status(401).json({ error: "Unauthorized" });
  }
};
