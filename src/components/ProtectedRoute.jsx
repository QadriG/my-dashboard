import React, { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../hooks/useAdminAuth";
import { useUserAuth } from "../hooks/useUserAuth";

export default function ProtectedRoute({ children, allowedRoles }) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const navigate = useNavigate();

  const adminAuth = useAdminAuth();
  const userAuth = useUserAuth();

  // Role-specific logout
  const logout = async (role) => {
    try {
      await fetch("http://localhost:5000/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      if (role === "admin") {
        localStorage.removeItem("adminToken");
        adminAuth.logout && adminAuth.logout();
      } else {
        localStorage.removeItem("userToken");
        userAuth.logout && userAuth.logout();
      }
      localStorage.removeItem("role");
      sessionStorage.clear();
      setAuthorized(false);
      navigate("/login", { replace: true });
    }
  };

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/auth/check-auth", {
          method: "GET",
          credentials: "include",
          headers: { "Cache-Control": "no-store" },
        });

        let data = {};
        if (res.status !== 304 && res.status !== 204) data = await res.json();

        // Admin fix: fallback to localStorage if backend returns 204
        const role = data.role || localStorage.getItem("role");

        if ((res.ok || res.status === 304) && role && allowedRoles.includes(role)) {
          if (isMounted) setAuthorized(true);
        } else {
          await logout(role);
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        await logout(localStorage.getItem("role"));
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    checkAuth();

    const handlePopState = () => {
      if (!authorized) return;
      logout(localStorage.getItem("role"));
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      isMounted = false;
      window.removeEventListener("popstate", handlePopState);
    };
  }, [allowedRoles, authorized]);

  if (loading) return <div className="text-white text-center mt-20">Checking authentication...</div>;
  if (!authorized) return <Navigate to="/login" replace />;

  return children;
}
