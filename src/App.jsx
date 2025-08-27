import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import Login from "./components/Auth/Login";
import AdminDashboard from "./components/Dashboard";
import UserDashboard from "./components/Users/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import ResetPassword from "./components/Auth/ResetPassword";
import Settings from "./components/settings";

import Sidebar from "./components/Sidebar"; // ✅ Admin Sidebar
import UserSidebar from "./components/Users/UserSidebar"; // ✅ User Sidebar

// ✅ Layout for Admin
function AdminLayout({ children }) {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-4">{children}</div>
    </div>
  );
}

// ✅ Layout for User
function UserLayout({ children }) {
  return (
    <div className="flex">
      <UserSidebar />
      <div className="flex-1 p-4">{children}</div>
    </div>
  );
}

function App() {
  useEffect(() => {
    // Optional: handle cache or auth refresh
  }, []);

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/verify-email/:token" element={<Navigate to="/login" replace />} />

        {/* Protected Admin Dashboard */}
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

        {/* Protected User Dashboard */}
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

        {/* Protected Settings (accessible to both admin and user) */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRoles={["admin", "user"]}>
              {/* 👇 If you want separate sidebars even in settings, 
                  you need two routes: /admin/settings & /user/settings */}
              <AdminLayout>
                <Settings />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        {/* Catch-all redirects */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
