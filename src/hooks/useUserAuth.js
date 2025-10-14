import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const UserAuthContext = createContext();

export function UserAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/auth/check-auth", {
          method: "GET",
          credentials: "include",
          headers: { "Cache-Control": "no-store" },
        });

        if (res.ok) {
          const data = await res.json();
          setUser({ id: data.id, email: data.email, role: data.role, status: data.status, isVerified: data.isVerified });
          localStorage.setItem("role", data.role);
        } else {
          setUser(null);
          localStorage.removeItem("role");
        }
      } catch (err) {
        console.error("Failed to fetch user:", err);
        setUser(null);
        localStorage.removeItem("role");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem("role", userData.role);
  };

  const logout = async () => {
    try {
      await fetch("http://localhost:5000/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("User logout failed:", err);
    } finally {
      setUser(null);
      localStorage.removeItem("role");
      sessionStorage.clear();
      navigate("/login", { replace: true });
    }
  };

  return (
    <UserAuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </UserAuthContext.Provider>
  );
}

export function useUserAuth() {
  const context = useContext(UserAuthContext);
  if (!context) throw new Error("useUserAuth must be used within UserAuthProvider");
  return context;
}