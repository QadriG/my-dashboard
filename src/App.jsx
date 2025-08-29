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

// ----------------------
// Admin Layout
// ----------------------
export function AdminLayout({ children }) {
  const { isDarkMode } = useTheme();
  return (
    <ChatProvider>
      <div className={`flex ${isDarkMode ? "dark-mode" : "light-mode"}`} style={{ minHeight: "100vh" }}>
        <Sidebar />
        <main className="flex-1 p-4 relative">
          {children}
          <LiveChat /> {/* Optional: Admin can have chat too */}
        </main>
      </div>
    </ChatProvider>
  );
}

// ----------------------
// User Layout
// ----------------------
export function UserLayout({ children }) {
  const { isDarkMode } = useTheme();
  return (
    <ChatProvider>
      <div className={`flex ${isDarkMode ? "dark-mode" : "light-mode"}`} style={{ minHeight: "100vh" }}>
        <UserSidebar />
        <main className="flex-1 p-4 relative">
          {children}
          <LiveChat /> {/* Persistent global chat */}
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
        <Route
          path="/admin/api-details"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminLayout>
                <ApiDetails />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/positions"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminLayout>
                <AdminPositions />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

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
        <Route
          path="/user/api-details"
          element={
            <ProtectedRoute allowedRoles={["user"]}>
              <UserLayout>
                <ApiDetails />
              </UserLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/positions"
          element={
            <ProtectedRoute allowedRoles={["user"]}>
              <UserLayout>
                <UserPositions />
              </UserLayout>
            </ProtectedRoute>
          }
        />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
