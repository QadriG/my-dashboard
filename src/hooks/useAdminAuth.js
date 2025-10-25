// src/hooks/useAdminAuth.js
import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AdminAuthContext = createContext();

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true); // Add loading state
  const navigate = useNavigate();

  // On mount, check auth status
  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        // Use the same auth check endpoint, but expect admin role
        const res = await fetch("http://localhost:5000/api/auth/check-auth", {
          method: "GET",
          credentials: "include", // Important to include session cookie
          headers: { "Cache-Control": "no-store" },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.role === 'admin') { // Check if the user is an admin
             // Extract token from cookie if needed (though typically session is sufficient for backend checks)
            // const token = document.cookie
            //   .split("; ")
            //   .find(row => row.startsWith("token="))
            //   ?.split("=")[1];
            setAdmin({ id: data.id, email: data.email, role: data.role, status: data.status, isVerified: data.isVerified }); // Store admin info
            // localStorage.setItem("adminToken", token || ""); // Only store token if you manage admin auth differently
          } else {
            // User is authenticated but not an admin
            setAdmin(null);
            // Optionally redirect or show an error
            // navigate('/unauthorized'); // Example redirect
          }
        } else {
          // User is not authenticated or token is invalid
          setAdmin(null);
        }
      } catch (err) {
        console.error("Failed to fetch admin:", err);
        setAdmin(null);
      } finally {
        setLoading(false); // Set loading to false after fetch attempt
      }
    };

    fetchAdmin();
  }, [navigate]); // Depend on navigate if used for redirects

  const login = (adminData) => {
    // Assuming login sets session cookie handled by backend
    // Extract token from cookie if needed, though session is typical
    // const token = document.cookie
    //   .split("; ")
    //   .find(row => row.startsWith("token="))
    //   ?.split("=")[1];
    setAdmin({ ...adminData }); // Store admin info
    // localStorage.setItem("adminToken", token || ""); // Only if token is managed client-side
  };

  const logout = async () => {
    try {
      await fetch("http://localhost:5000/api/auth/logout", {
        method: "POST",
        credentials: "include", // Include session cookie to clear server-side session
      });
    } catch (err) {
      console.error("Admin logout failed:", err);
    } finally {
      // localStorage.removeItem("adminToken"); // Only if token is managed client-side
      sessionStorage.clear();
      setAdmin(null);
      navigate("/admin/login", { replace: true }); // Redirect to admin login
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