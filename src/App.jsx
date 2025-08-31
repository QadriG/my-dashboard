import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";

// Auth & Protected
import Login from "./components/Auth/Login";
import ResetPassword from "./components/Auth/ResetPassword";
import ProtectedRoute from "./components/ProtectedRoute";
import { AdminAuthProvider } from "./hooks/useAdminAuth";
import { UserAuthProvider } from "./hooks/useUserAuth";

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

// Live Chat
import LiveChat from "./components/Users/LiveChat";
import { ChatProvider } from "./context/ChatContext";

// Theme
import { useTheme } from "./context/ThemeContext";
import { Outlet } from "react-router-dom";

// ----------------------
// Admin Layout
// ----------------------
export function AdminLayout() {
  const { isDarkMode } = useTheme();
  return (
    <ChatProvider>
      <div className={`flex ${isDarkMode ? "dark-mode" : "light-mode"}`} style={{ minHeight: "100vh" }}>
        <Sidebar />
        <main className="flex-1 p-4 relative">
          <Outlet />
        </main>
      </div>
    </ChatProvider>
  );
}

// ----------------------
// User Layout
// ----------------------
export function UserLayout() {
  const { isDarkMode } = useTheme();
  return (
    <ChatProvider>
      <div className={`flex ${isDarkMode ? "dark-mode" : "light-mode"}`} style={{ minHeight: "100vh" }}>
        <UserSidebar />
        <main className="flex-1 p-4 relative">
          <Outlet />
          <LiveChat />
        </main>
      </div>
    </ChatProvider>
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
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="api-details" element={<ApiDetails />} />
              <Route path="positions" element={<AdminPositions />} />
            </Route>

            {/* User routes (fixed logout) */}
            <Route path="/user" element={
              <ProtectedRoute allowedRoles={["user"]}>
                <UserLayout />
              </ProtectedRoute>
            }>
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
