// src/hooks/useAdminAuth.js
import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AdminAuthContext = createContext();

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const navigate = useNavigate();

  // On mount, check if token exists
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (token) {
      // Optional: fetch admin info from backend using token
      setAdmin({ token });
    }
  }, []);

  const login = (adminData) => {
    setAdmin(adminData);
    localStorage.setItem("adminToken", adminData?.token || "");
  };

  const logout = async () => {
    try {
      await fetch("http://localhost:5000/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Admin logout failed:", err);
    } finally {
      localStorage.removeItem("adminToken");
      sessionStorage.clear();
      setAdmin(null);
      navigate("/login", { replace: true });
    }
  };

  return (
    <AdminAuthContext.Provider value={{ admin, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return context;
}
