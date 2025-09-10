// src/hoc/withUserAuthProtection.jsx
import React, { useEffect, useState } from "react";
import { useUserAuth } from "../hooks/useUserAuth";
import { useNavigate } from "react-router-dom";

export default function withUserAuthProtection(WrappedComponent) {
  return function ProtectedComponent(props) {
    const { user, logout } = useUserAuth();
    const navigate = useNavigate();
    const [checking, setChecking] = useState(true);

    useEffect(() => {
      const checkAuth = async () => {
        try {
          const res = await fetch("http://localhost:5000/api/auth/check-auth", {
            method: "GET",
            credentials: "include",
          });
          const data = await res.json();

          if (!res.ok || data.role !== "user") {
            logout();
          }
        } catch {
          logout();
        } finally {
          setChecking(false);
        }
      };

      checkAuth();
    }, [logout]);

    useEffect(() => {
      if (!user && !checking) {
        navigate("/login", { replace: true }); // Redirect to login if not authenticated
      }
    }, [user, checking, navigate]);

    if (checking) {
      return <div className="text-center mt-20 text-white">Checking authentication...</div>;
    }

    if (!user) return null; // Prevent rendering before redirect

    return <WrappedComponent {...props} />;
  };
}
