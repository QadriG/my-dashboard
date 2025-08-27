import { useState, useEffect } from "react";

export default function useAuth(requiredRole) {
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [userData, setUserData] = useState(null);

  const logout = async (callback) => {
    try {
      await fetch("http://localhost:5000/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setUserData(null);
      setIsAuthorized(false);
      callback?.();
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
        const data = await res.json();

        if (res.status === 401) {
          // Try refreshing token
          const refreshRes = await fetch("http://localhost:5000/api/auth/refresh-token", {
            method: "POST",
            credentials: "include",
          });
          const refreshData = await refreshRes.json();

          if (refreshRes.ok) {
            const retryRes = await fetch("http://localhost:5000/api/auth/check-auth", {
              method: "GET",
              credentials: "include",
              headers: { "Cache-Control": "no-store" },
            });
            const retryData = await retryRes.json();
            if (
              retryRes.ok &&
              (!requiredRole || retryData.role.toLowerCase() === requiredRole.toLowerCase())
            ) {
              if (isMounted) {
                setUserData(retryData);
                setIsAuthorized(true);
              }
            } else {
              if (isMounted) setIsAuthorized(false);
            }
          } else {
            if (isMounted) setIsAuthorized(false);
          }
        } else if (res.ok && (!requiredRole || data.role.toLowerCase() === requiredRole.toLowerCase())) {
          if (isMounted) {
            setUserData(data);
            setIsAuthorized(true);
          }
        } else {
          if (isMounted) setIsAuthorized(false);
        }
      } catch (err) {
        console.error("useAuth auth check failed:", err);
        if (isMounted) setIsAuthorized(false);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [requiredRole]);

  return { loading, isAuthorized, userData, logout };
}
