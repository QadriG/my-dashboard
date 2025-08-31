import { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";

const UserAuthContext = createContext();

export function UserAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem("userToken", userData?.token || "");
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
      localStorage.removeItem("userToken");
      sessionStorage.clear();
      setUser(null);
      navigate("/login", { replace: true });
    }
  };

  return (
    <UserAuthContext.Provider value={{ user, login, logout }}>
      {children}
    </UserAuthContext.Provider>
  );
}

export function useUserAuth() {
  return useContext(UserAuthContext);
}
