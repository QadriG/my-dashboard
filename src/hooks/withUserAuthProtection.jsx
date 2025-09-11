// src/hoc/withUserAuthProtection.jsx
import React, { useEffect, useState } from "react";
import { useUserAuth } from "../hooks/useUserAuth";
import { useNavigate } from "react-router-dom";

export default function withAuthProtection(WrappedComponent, allowedRoles = ["user"]) {
  return function ProtectedComponent(props) {
    const { user, logout } = useUserAuth();
    const navigate = useNavigate();
    const [checking, setChecking] = useState(true);

    useEffect(() => {
      if (user) { setChecking(false); return; }

      const checkAuth = async () => {
        try {
          const res = await fetch("http://localhost:5000/api/auth/check-auth", {
            method: "GET",
            credentials: "include",
          });
          const data = await res.json();
          if (!res.ok || !allowedRoles.includes(data.role)) logout();
        } catch (err) {
          console.error("Auth check failed:", err);
          logout();
        } finally {
          setChecking(false);
        }
      };

      checkAuth();
    }, [user, logout]);

    useEffect(() => {
      if (!user && !checking) navigate("/login", { replace: true });
    }, [user, checking, navigate]);

    if (checking) return <div>Checking authentication...</div>;
    if (!user) return null;

    return <WrappedComponent {...props} />;
  };
}
