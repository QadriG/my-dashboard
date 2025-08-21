import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, allowedRoles }) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

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
          localStorage.clear();
          sessionStorage.clear();
          setAuthorized(false);
        }
      } catch (err) {
        console.error("Auth check error:", err);
        localStorage.clear();
        sessionStorage.clear();
        setAuthorized(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    const handlePopState = () => {
      setAuthorized(false);
      localStorage.clear();
      sessionStorage.clear();
    };
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [allowedRoles]);

  if (loading) return <div className="text-white text-center mt-20">Checking authentication...</div>;
  if (!authorized) return <Navigate to="/my-dashboard/login" replace />;

  return children;
}