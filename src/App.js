import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import Login from "./components/Auth/Login";
import AdminDashboard from "./components/Dashboard";
import UserDashboard from "./components/Users/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import ResetPassword from "./components/Auth/ResetPassword";

function App() {
  // Optional: Prevent browser caching (move to ProtectedRoute if needed)
  useEffect(() => {
    // This can be removed or handled in ProtectedRoute for better control
  }, []);

  return (
    <Router basename="/my-dashboard">
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
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Protected User Dashboard */}
        <Route
          path="/user"
          element={
            <ProtectedRoute allowedRoles={["user"]}>
              <UserDashboard />
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