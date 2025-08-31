import { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";

const AdminAuthContext = createContext();

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const navigate = useNavigate();

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
  return useContext(AdminAuthContext);
}
