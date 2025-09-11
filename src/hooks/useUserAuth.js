import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const UserAuthContext = createContext();

export function UserAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // track loading state
  const navigate = useNavigate();

  // ✅ Fetch user from backend DB
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("userToken");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("http://localhost:5000/api/auth/check-auth", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data); // { id, email, role, status, isVerified }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Failed to fetch user:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // ✅ Login: just store user info & token
  const login = (userData) => {
    setUser(userData);
    localStorage.setItem("userToken", userData?.token || "");
  };

  // ✅ Logout: clear session & redirect
  const logout = async () => {
    try {
      await fetch("http://localhost:5000/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("User logout failed:", err);
    } finally {
      localStorage.removeItem("userToken");
      sessionStorage.clear();
      setUser(null);
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
