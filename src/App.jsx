import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";

// Auth & Protected
import Login from "./components/Auth/Login";
import ResetPassword from "./components/Auth/ResetPassword";
import ProtectedRoute from "./components/ProtectedRoute";
import { AdminAuthProvider } from "./hooks/useAdminAuth";
import { UserAuthProvider } from "./hooks/useUserAuth";
import { useAdminAuth } from "./hooks/useAdminAuth";
import { useUserAuth } from "./hooks/useUserAuth";

// Dashboards
import AdminDashboard from "./components/Dashboard";
import UserDashboard from "./components/Users/Dashboard";

// Settings
import AdminSettings from "./components/settings";
import UserSettings from "./components/Users/settings";
import ApiDetails from "./components/Users/ApiDetails";

// Positions
import AdminPositions from "./components/Positions";
import UserPositions from "./components/Users/Positions";

// Sidebars
import Sidebar from "./components/Sidebar";
import UserSidebar from "./components/Users/Sidebar";

// Theme
import { useTheme } from "./context/ThemeContext";
import { Outlet } from "react-router-dom";

// Users/Logs/ManualPush
import AdminLogs from "./components/Logs";
import AdminUsers from "./components/Users";
import AdminManualPush from "./components/ManualPush";

// ----------------------
// Admin Layout (chat-free)
// ----------------------
export function AdminLayout() {
  const { isDarkMode } = useTheme();
  useAdminAuth(); // still get auth

  return (
    <div className={`flex ${isDarkMode ? "dark-mode" : "light-mode"}`} style={{ minHeight: "100vh" }}>
      <Sidebar />
      <main className="flex-1 p-4 relative">
        <Outlet />
      </main>
    </div>
  );
}

// ----------------------
// User Layout (chat-free)
// ----------------------
export function UserLayout() {
  const { isDarkMode } = useTheme();
  useUserAuth(); // still get auth

  return (
    <div className={`flex ${isDarkMode ? "dark-mode" : "light-mode"}`} style={{ minHeight: "100vh" }}>
      <UserSidebar />
      <main className="flex-1 p-4 relative">
        <Outlet />
      </main>
    </div>
  );
}

// ----------------------
// App Component
// ----------------------
function App() {
  useEffect(() => {}, []);

  return (
    <Router>
      <AdminAuthProvider>
        <UserAuthProvider>
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
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="api-details" element={<ApiDetails />} />
              <Route path="positions" element={<AdminPositions />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="logs" element={<AdminLogs />} />
              <Route path="manualpush" element={<AdminManualPush />} />
              <Route path="users/:id/dashboard" element={<UserDashboard />} />
              <Route path="users/:id/positions" element={<UserPositions />} />
            </Route>

            {/* User routes */}
            <Route
              path="/user"
              element={
                <ProtectedRoute allowedRoles={["user"]}>
                  <UserLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<UserDashboard />} />
              <Route path="settings" element={<UserSettings />} />
              <Route path="api-details" element={<ApiDetails />} />
              <Route path="positions" element={<UserPositions />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </UserAuthProvider>
      </AdminAuthProvider>
    </Router>
  );
}

export default App;
