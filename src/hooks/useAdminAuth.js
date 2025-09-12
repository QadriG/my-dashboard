import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AdminAuthContext = createContext();

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true); // track loading state
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAdmin = async () => {
      const token = localStorage.getItem("adminToken");
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

        // If 204 No Content, just keep the token and admin context
        if (res.status === 204) {
          setAdmin({ token, role: "admin" });
        } 
        else if (res.ok) {
          const data = await res.json(); // { id, email, role, ... }
          if (data.role === "admin") {
            setAdmin(data);
          } else {
            setAdmin(null);
            localStorage.removeItem("adminToken");
          }
        } else {
          setAdmin(null);
          localStorage.removeItem("adminToken");
        }
      } catch (err) {
        console.error("Failed to fetch admin:", err);
        setAdmin(null);
        localStorage.removeItem("adminToken");
      } finally {
        setLoading(false);
      }
    };

    fetchAdmin();
  }, []);

  // Login: store admin info & token
  const login = (adminData) => {
    setAdmin(adminData);
    localStorage.setItem("adminToken", adminData?.token || "");
  };

  // Logout: clear session & redirect
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
    <AdminAuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return context;
}
