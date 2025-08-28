import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";

// Auth & Protected
import Login from "./components/Auth/Login";
import ResetPassword from "./components/Auth/ResetPassword";
import ProtectedRoute from "./components/ProtectedRoute";

// Dashboards
import AdminDashboard from "./components/Dashboard";
import UserDashboard from "./components/Users/Dashboard";

// Settings
import AdminSettings from "./components/settings";        
import UserSettings from "./components/Users/settings";  

// Sidebars
import Sidebar from "./components/Sidebar";              
import UserSidebar from "./components/Users/Sidebar";   

// Theme
import { useTheme } from "./context/ThemeContext";

// ✅ Layout for Admin
export function AdminLayout({ children }) {
  const { isDarkMode } = useTheme();
  return (
    <div className={`flex ${isDarkMode ? "dark-mode" : "light-mode"}`} style={{ minHeight: "100vh" }}>
      <Sidebar />
      <main className="flex-1 p-4">{children}</main>
    </div>
  );
}

// ✅ Layout for User
export function UserLayout({ children }) {
  const { isDarkMode } = useTheme();
  return (
    <div className={`flex ${isDarkMode ? "dark-mode" : "light-mode"}`} style={{ minHeight: "100vh" }}>
      <UserSidebar />
      <main className="flex-1 p-4">{children}</main>
    </div>
  );
}

function App() {
  useEffect(() => {}, []);

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/verify-email/:token" element={<Navigate to="/login" replace />} />

        {/* Admin routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminLayout>
                <AdminSettings />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        {/* ...other admin routes */}

        {/* User routes */}
        <Route
          path="/user"
          element={
            <ProtectedRoute allowedRoles={["user"]}>
              <UserLayout>
                <UserDashboard />
              </UserLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/settings"
          element={
            <ProtectedRoute allowedRoles={["user"]}>
              <UserLayout>
                <UserSettings />
              </UserLayout>
            </ProtectedRoute>
          }
        />
        {/* ...other user routes */}

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
