import React, { useEffect } from "react";
import { useUserAuth } from "../hooks/useUserAuth";
import { useNavigate } from "react-router-dom";

export default function withUserAuthProtection(WrappedComponent) {
  return function ProtectedComponent(props) {
    const { user, logout } = useUserAuth();
    const navigate = useNavigate();

    // Redirect immediately if not logged in
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
        }
      };

      checkAuth();
    }, [logout]);

    useEffect(() => {
      if (!user) {
        navigate("/user/login", { replace: true });
      }
    }, [user, navigate]);

    // While user is null (checking auth), render nothing or loader
    if (!user) return <div className="text-center mt-20 text-white">Checking authentication...</div>;

    return <WrappedComponent {...props} />;
  };
}
