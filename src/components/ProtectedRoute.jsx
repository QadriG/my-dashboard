import React, { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../hooks/useAdminAuth";
import { useUserAuth } from "../hooks/useUserAuth";

export default function ProtectedRoute({ children, allowedRoles }) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const navigate = useNavigate();

  // Always call both hooks
  const adminAuth = useAdminAuth();
  const userAuth = useUserAuth();

  // Unified logout function mimicking admin style
  const logout = async () => {
    try {
      await fetch("http://localhost:5000/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      if (allowedRoles.includes("admin")) {
        localStorage.removeItem("adminToken");
        setAuthorized(false);
        adminAuth.logout && adminAuth.logout();
      } else {
        localStorage.removeItem("userToken");
        setAuthorized(false);
        userAuth.logout && userAuth.logout();
      }
      sessionStorage.clear();
      navigate("/login", { replace: true });
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/auth/check-auth", {
          method: "GET",
          credentials: "include",
          headers: { "Cache-Control": "no-store" },
        });
        const data = await res.json();

        if (res.ok && allowedRoles.includes(data.role)) {
          setAuthorized(true);
        } else {
          await logout();
        }
      } catch {
        await logout();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    const handlePopState = () => {
      if (!authorized) logout();
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [allowedRoles, authorized]);

  if (loading) return <div className="text-white text-center mt-20">Checking authentication...</div>;
  if (!authorized) return <Navigate to="/login" replace />;

  return children;
}
