import React, { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useUserAuth } from "../hooks/useUserAuth";

export default function ProtectedRoute({ children, allowedRoles }) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useUserAuth();

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:5000/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      logout();
      localStorage.removeItem("role");
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
          await handleLogout();
        }
      } catch {
        await handleLogout();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    const handlePopState = () => {
      if (!authorized) handleLogout();
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [allowedRoles, authorized]);

  if (loading) return <div className="text-white text-center mt-20">Checking authentication...</div>;
  if (!authorized) return <Navigate to="/login" replace />;

  return children;
}