import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, allowedRoles }) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/auth/check-auth", {
          credentials: "include",
        });
        const data = await res.json();

        if (res.ok && allowedRoles.includes(data.role)) {
          setAuthorized(true);
        } else {
          setAuthorized(false);
        }
      } catch (err) {
        setAuthorized(false);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [allowedRoles]);

  if (loading) return <div className="text-white text-center mt-20">Checking authentication...</div>;
  if (!authorized) return <Navigate to="/login" replace />;

  return children;
}
