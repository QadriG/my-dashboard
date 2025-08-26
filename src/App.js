import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import Login from "./components/Auth/Login";
import AdminDashboard from "./components/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import ResetPassword from "./components/Auth/ResetPassword";

function App() {
  useEffect(() => {
    // Remove or handle caching here if needed
  }, []);

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/verify-email/:token" element={<Navigate to="/login" replace />} />

        {/* Protected Admin Dashboard with nested pages */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
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
